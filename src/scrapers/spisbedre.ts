import { z } from 'zod'

import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { IngredientGroup, InstructionGroup, RecipeFields } from '@/types/recipe.interface'
import { embeddedPayload } from '@/utils/embedded-payload'
import { createIngredientGroup, createIngredientItem } from '@/utils/ingredients'
import { createInstructionGroup, createInstructionItem } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

/** Unit the site never renders next to an ingredient amount. */
const HIDDEN_UNIT_ID = 21

/** Serving size unit id meaning "persons"; any other unit counts items. */
const SERVING_UNIT_ID = 1

/** Fractional parts the site renders as vulgar fraction glyphs. */
const FRACTION_GLYPHS: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' }

const nameSchema = z.object({
  name_singular: z.string().nullish(),
  name_plural: z.string().nullish(),
})

const unitSchema = nameSchema.extend({ abbreviation: z.string().nullish() })

const ingredientSchema = z.object({
  amount: z.number().nullish(),
  unit_id: z.number().nullish(),
  unit_inflection: z.string().nullish(),
  unit: unitSchema.nullish(),
  ingredient_inflection: z.string().nullish(),
  ingredient: nameSchema.nullish(),
  prefix: z.string().nullish(),
  suffix: z.string().nullish(),
})

const recipeSchema = z.object({
  serving_size: z.number().nullish(),
  serving_size_unit_id: z.number().nullish(),
  tags: z.array(z.object({ name: z.string() })).nullish(),
  grouped_ingredients: z
    .array(z.object({ title: z.string().nullish(), ingredients: z.array(ingredientSchema) }))
    .nullish(),
  grouped_instructions: z
    .array(
      z.object({
        title: z.string().nullish(),
        instructions: z.array(z.object({ instruction: z.string().nullish() })),
      }),
    )
    .nullish(),
  grouped_equipment: z
    .array(z.object({ equipment: z.array(z.object({ name: z.string().nullish() })) }))
    .nullish(),
  nutrition: z
    .object({
      calories: z.number().nullish(),
      fat: z.number().nullish(),
      carbohydrates: z.number().nullish(),
      protein: z.number().nullish(),
    })
    .nullish(),
})

const pageSchema = z.object({ props: z.object({ recipe: recipeSchema }) })

type Recipe = z.infer<typeof recipeSchema>
type Ingredient = z.infer<typeof ingredientSchema>
type Names = z.infer<typeof nameSchema>

/**
 * Picks the singular or plural name the way the site does: an explicit
 * inflection wins, otherwise amounts between 0 and 2 are singular.
 */
function inflect(names: Names, inflection: string | null | undefined, amount: number | null) {
  if (inflection === 'singular') return names.name_singular
  if (inflection === 'plural') return names.name_plural
  return amount !== null && amount > 0 && amount < 2 ? names.name_singular : names.name_plural
}

/**
 * Formats an amount like the site: comma decimals, with quarters and halves
 * rendered as fraction glyphs (e.g. `1.5` becomes `1½`).
 */
function formatAmount(amount: number): string {
  const whole = Math.trunc(amount)
  const glyph = FRACTION_GLYPHS[Math.round((amount - whole) * 100) / 100]

  if (glyph) {
    return whole === 0 ? glyph : `${whole}${glyph}`
  }

  return String(amount).replace('.', ',')
}

/**
 * Builds the ingredient line shown on the page, scaling the per-serving
 * amount by the recipe's serving size.
 */
function formatIngredient(ingredient: Ingredient, servings: number): string {
  const { amount, unit, unit_id: unitId, ingredient: names } = ingredient
  const total = amount ? Math.round(amount * servings * 100) / 100 : null
  const parts: (string | null | undefined)[] = []

  if (total !== null) {
    parts.push(formatAmount(total))
  }

  if (unit && total !== null && unitId !== HIDDEN_UNIT_ID) {
    parts.push(unit.abbreviation || inflect(unit, ingredient.unit_inflection, total))
  }

  if (names) {
    parts.push(
      ingredient.prefix,
      inflect(names, ingredient.ingredient_inflection, total),
      ingredient.suffix,
    )
  }

  return normalizeString(parts.filter(Boolean).join(' '))
}

export class SpisBedre extends AbstractScraper {
  /** The recipe from the Inertia page payload in the `data-page` attribute of `#app`. */
  private readonly pagePayload = embeddedPayload(this.$, {
    selector: '#app',
    attribute: 'data-page',
    name: 'SpisBedre data-page',
    parse: (data) => pageSchema.parse(data).props.recipe,
    logger: this.logger,
  })

  static host() {
    return 'spisbedre.dk'
  }

  protected override readonly extractors = {
    category: this.category.bind(this),
    equipment: this.equipment.bind(this),
    ingredients: this.ingredients.bind(this),
    instructions: this.instructions.bind(this),
    nutrients: this.nutrients.bind(this),
    yields: this.yields.bind(this),
  } satisfies ScraperExtractors

  private get recipe(): Recipe | null {
    return this.pagePayload()
  }

  protected category(prevValue: RecipeFields['category'] | undefined): RecipeFields['category'] {
    if (prevValue && prevValue.size > 0) {
      return prevValue
    }

    const names = (this.recipe?.tags ?? []).map(({ name }) => normalizeString(name))
    return new Set(names.filter(Boolean))
  }

  protected equipment(prevValue: RecipeFields['equipment'] | undefined): RecipeFields['equipment'] {
    if (prevValue && prevValue.size > 0) {
      return prevValue
    }

    const names = (this.recipe?.grouped_equipment ?? []).flatMap((group) =>
      group.equipment.map(({ name }) => normalizeString(name)),
    )
    return new Set(names.filter(Boolean))
  }

  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    if (prevValue && prevValue.length > 0) {
      return prevValue
    }

    const servings = this.recipe?.serving_size ?? 1
    const groups = (this.recipe?.grouped_ingredients ?? [])
      .map(({ title, ingredients }): IngredientGroup => {
        const items = ingredients
          .map((ingredient) => formatIngredient(ingredient, servings))
          .filter(Boolean)
          .map(createIngredientItem)
        return createIngredientGroup(normalizeString(title) || null, items)
      })
      .filter((group) => group.items.length > 0)

    if (groups.length === 0) {
      throw new Error('Failed to extract ingredients')
    }

    return groups
  }

  protected instructions(
    prevValue: RecipeFields['instructions'] | undefined,
  ): RecipeFields['instructions'] {
    if (prevValue && prevValue.length > 0) {
      return prevValue
    }

    const groups = (this.recipe?.grouped_instructions ?? [])
      .map(({ title, instructions }): InstructionGroup => {
        const items = instructions
          .map(({ instruction }) => normalizeString(instruction))
          .filter(Boolean)
          .map(createInstructionItem)
        return createInstructionGroup(normalizeString(title) || null, items)
      })
      .filter((group) => group.items.length > 0)

    if (groups.length === 0) {
      throw new Error('Failed to extract instructions')
    }

    return groups
  }

  protected nutrients(prevValue: RecipeFields['nutrients'] | undefined): RecipeFields['nutrients'] {
    if (prevValue && prevValue.size > 0) {
      return prevValue
    }

    const nutrition = this.recipe?.nutrition
    const nutrients: RecipeFields['nutrients'] = new Map()

    if (!nutrition) {
      return nutrients
    }

    const entries = [
      ['calories', nutrition.calories, 'kcal'],
      ['fatContent', nutrition.fat, 'g'],
      ['carbohydrateContent', nutrition.carbohydrates, 'g'],
      ['proteinContent', nutrition.protein, 'g'],
    ] as const

    for (const [key, value, unit] of entries) {
      if (typeof value === 'number') {
        nutrients.set(key, `${Math.round(value)} ${unit}`)
      }
    }

    return nutrients
  }

  /**
   * Uses the payload's serving size and unit, since the microdata yield is a
   * bare number that cannot tell servings from items.
   */
  protected yields(prevValue: RecipeFields['yields'] | undefined): RecipeFields['yields'] {
    const servings = this.recipe?.serving_size

    if (!servings) {
      if (prevValue) {
        return prevValue
      }

      throw new Error('Failed to extract yields')
    }

    const count = Math.trunc(servings)
    const unit = this.recipe?.serving_size_unit_id === SERVING_UNIT_ID ? 'serving' : 'item'

    return `${count} ${unit}${count === 1 ? '' : 's'}`
  }
}
