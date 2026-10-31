import z from 'zod'

import { AbstractScraper } from '@/abstract-scraper'
import type { RecipeData } from '@/types/recipe.interface'
import { embeddedPayload } from '@/utils/embedded-payload'
import { stringsToNotes } from '@/utils/notes'
import { normalizeString } from '@/utils/parsing'

const legacyRecipeSchema = z.object({
  tips: z.array(z.string()).optional(),
})

const scoopTipSchema = z.object({
  details: z.object({
    doc: z.object({
      content: z.array(
        z.object({
          content: z.array(z.object({ text: z.string().optional() })).optional(),
        }),
      ),
    }),
  }),
})

const nextDataSchema = z.object({
  props: z.object({
    pageProps: z.object({
      recipe: legacyRecipeSchema.optional(),
      scoopRecipe: z.object({ tips: z.array(scoopTipSchema).optional() }).optional(),
    }),
  }),
})

function scoopTipText(tip: z.infer<typeof scoopTipSchema>): string {
  return tip.details.doc.content
    .map((block) => block.content?.map(({ text = '' }) => text).join('') ?? '')
    .join(' ')
}

export class NYTimes extends AbstractScraper {
  private readonly nextData = embeddedPayload(this.$, {
    selector: '#__NEXT_DATA__',
    name: 'NYTimes __NEXT_DATA__',
    parse: (data) => nextDataSchema.parse(data),
    logger: this.logger,
  })

  static host() {
    return 'cooking.nytimes.com'
  }

  // Use wildcard selectors to handle dynamic class name suffixes
  protected override readonly ingredientGroupStructure = {
    heading: 'h3[class*="ingredientgroup_name"]',
    item: 'li[class*="ingredient"]',
  }

  protected override notes(): RecipeData['notes'] {
    const payloadNotes = this.payloadNotes()

    if (payloadNotes) {
      return payloadNotes
    }

    return this.domNotes()
  }

  private payloadTips(): string[] {
    const { recipe, scoopRecipe } = this.nextData()?.props.pageProps ?? {}
    return recipe?.tips ?? scoopRecipe?.tips?.map(scoopTipText) ?? []
  }

  private payloadNotes(): RecipeData['notes'] {
    const tips = this.payloadTips()
    const values = tips.map(normalizeString).filter((value) => value.length > 0)

    if (values.length === 0) {
      return undefined
    }

    return stringsToNotes(values)
  }

  private domNotes(): RecipeData['notes'] {
    const container = this.$('div[class*="tips_tips"]').first()

    if (container.length === 0) {
      return undefined
    }

    const listValues = container
      .find('li, p')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter((value) => value.length > 0)

    if (listValues.length > 0) {
      return stringsToNotes(listValues)
    }

    const content = container.clone()
    content.find('.pantry--label').remove()

    const text = normalizeString(content.text())

    if (!text) {
      return undefined
    }

    return stringsToNotes([text])
  }
}
