import z from 'zod'

import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { NoIngredientsFoundException } from '@/exceptions'
import type { RecipeData, RecipeFields } from '@/types/recipe.interface'
import { flattenIngredients, groupIngredients } from '@/utils/ingredients'
import { parseJsonWithRepair } from '@/utils/json'
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
  private recipeTips: string[] | null | undefined = undefined

  static host() {
    return 'cooking.nytimes.com'
  }

  protected override readonly extractors = {
    ingredients: this.ingredients.bind(this),
  } satisfies ScraperExtractors

  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    // Use wildcard selectors to handle dynamic class name suffixes
    const headingSelector = 'h3[class*="ingredientgroup_name"]'
    const ingredientSelector = 'li[class*="ingredient"]'

    if (prevValue && prevValue.length > 0) {
      const values = flattenIngredients(prevValue)

      return groupIngredients(this.$, values, headingSelector, ingredientSelector)
    }

    throw new NoIngredientsFoundException()
  }

  protected override notes(): RecipeData['notes'] {
    const payloadNotes = this.payloadNotes()

    if (payloadNotes) {
      return payloadNotes
    }

    return this.domNotes()
  }

  private getPayloadTips(): string[] | null {
    if (this.recipeTips !== undefined) {
      return this.recipeTips
    }

    const raw = this.$('#__NEXT_DATA__').html()

    if (!raw) {
      this.logger.warn('Could not find NYTimes __NEXT_DATA__ payload')
      this.recipeTips = null
      return this.recipeTips
    }

    try {
      const { data } = parseJsonWithRepair(raw)
      const parsed = nextDataSchema.parse(data)
      const { recipe, scoopRecipe } = parsed.props.pageProps
      this.recipeTips = recipe?.tips ?? scoopRecipe?.tips?.map(scoopTipText) ?? null
    } catch (error) {
      this.logger.warn('Failed to parse NYTimes recipe payload', error)
      this.recipeTips = null
    }

    return this.recipeTips
  }

  private payloadNotes(): RecipeData['notes'] {
    const tips = this.getPayloadTips() ?? []
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
