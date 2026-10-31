import z from 'zod'

import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { Ingredients, RecipeFields } from '@/types/recipe.interface'
import { embeddedPayload } from '@/utils/embedded-payload'
import {
  createIngredientGroup,
  createIngredientItem,
  type IngredientGroupStructure,
  recoverIngredientGroups,
} from '@/utils/ingredients'
import { stringsToInstructions } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

// Use wildcard selectors to handle dynamic class name suffixes
const INGREDIENT_GROUPS: IngredientGroupStructure = {
  heading: '[class*="RecipeIngredientGroups_group"] > span',
  item: '[class*="RecipeIngredient"] label',
}

const recipeIngredientItemSchema = z.object({
  fields: z.object({
    qty: z.string(),
    preText: z.string(),
    postText: z.string(),
    measurement: z.string().nullable(),
    pluralIngredient: z.boolean(),
    ingredient: z.object({
      contentType: z.string(),
      fields: z.object({
        title: z.string(),
        pluralTitle: z.string(),
        kind: z.string(),
      }),
    }),
  }),
})

type RecipeIngredientItem = z.infer<typeof recipeIngredientItemSchema>

const recipeIngredientGroupSchema = z.object({
  fields: z.object({
    title: z.string(),
    recipeIngredientItems: z.array(recipeIngredientItemSchema),
  }),
})

const recipeInstructionSchema = z.object({
  fields: z.object({
    content: z.string(),
  }),
})

const recipeDataSchema = z.object({
  totalCookTime: z.number(),
  recipeTimeNote: z.string().optional(),
  ingredientGroups: z.array(recipeIngredientGroupSchema),
  headnote: z.string().optional(),
  instructions: z.array(recipeInstructionSchema),
  metaData: z.object({
    fields: z.object({
      photo: z.object({
        url: z.url(),
      }),
    }),
  }),
})

type RecipeData = z.infer<typeof recipeDataSchema>

const pagePropsDataSchema = z.object({
  props: z.object({
    pageProps: z.object({
      data: recipeDataSchema,
    }),
  }),
})

export class AmericasTestKitchen extends AbstractScraper {
  private readonly getRecipeData = embeddedPayload<RecipeData>(this.$, {
    selector: 'script[type="application/json"]',
    name: "America's Test Kitchen page data",
    parse: (data) => pagePropsDataSchema.parse(data).props.pageProps.data,
    logger: this.logger,
  })

  static host() {
    return 'americastestkitchen.com'
  }

  protected override readonly extractors = {
    image: this.image.bind(this),
    ingredients: this.ingredients.bind(this),
    instructions: this.instructions.bind(this),
    siteName: this.siteName.bind(this),
  } satisfies ScraperExtractors

  protected siteName(): RecipeFields['siteName'] {
    return "America's Test Kitchen"
  }

  protected image(prevValue: RecipeFields['image'] | undefined): RecipeFields['image'] {
    const data = this.getRecipeData()

    if (!data) {
      if (prevValue) {
        return prevValue
      }
      throw new Error('Failed to extract image')
    }

    return data.metaData.fields.photo.url
  }

  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    // First try the page payload, then restore groups from the HTML
    return this.parseIngredients() ?? recoverIngredientGroups(this.$, prevValue, INGREDIENT_GROUPS)
  }

  protected instructions(
    prevValue: RecipeFields['instructions'] | undefined,
  ): RecipeFields['instructions'] {
    const data = this.getRecipeData()

    if (!data) {
      if (prevValue) {
        return prevValue
      }
      throw new Error('Failed to extract instructions')
    }

    const { headnote } = data

    const items: string[] = []

    if (headnote) {
      items.push(`Note: ${normalizeString(headnote)}`)
    }

    for (const instruction of data.instructions) {
      items.push(normalizeString(instruction.fields.content))
    }

    return stringsToInstructions(items)
  }

  private parseIngredientItem(ingredientItem: RecipeIngredientItem): string {
    const { fields } = ingredientItem
    const fragments = [
      fields.qty || '',
      fields.measurement || '',
      fields.ingredient.fields.title || '',
      fields.postText || '',
    ]

    const filteredFragments: string[] = []

    for (const fragment of fragments) {
      if (fragment) {
        filteredFragments.push(fragment.trimEnd())
      }
    }

    return filteredFragments.join(' ').trimEnd().replace(' ,', ',')
  }

  private parseIngredients(): RecipeFields['ingredients'] | null {
    const data = this.getRecipeData()

    if (!data) {
      return null
    }

    const { ingredientGroups } = data

    const result: Ingredients = []

    for (const group of ingredientGroups) {
      const groupTitle = group.fields.title.length === 0 ? null : group.fields.title
      const items = group.fields.recipeIngredientItems.map((item) =>
        createIngredientItem(this.parseIngredientItem(item)),
      )

      result.push(createIngredientGroup(groupTitle, items))
    }

    return result
  }
}
