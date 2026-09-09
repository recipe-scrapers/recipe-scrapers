import { PostProcessorPlugin } from '@/abstract-postprocessor-plugin'
import type { IngredientParserOptions } from '@/types/ingredient-parser.interface'
import type { IngredientItem, Ingredients, RecipeFields } from '@/types/recipe.interface'
import { isIngredients } from '@/utils/ingredients'

type ParseIngredient = (typeof import('parse-ingredient'))['parseIngredient']

let parseIngredientPromise: Promise<ParseIngredient> | null = null

async function loadParseIngredient(): Promise<ParseIngredient> {
  parseIngredientPromise ??= import('parse-ingredient')
    .then(({ parseIngredient }) => parseIngredient)
    .catch((error: unknown) => {
      throw new Error(
        'Ingredient parsing requires the optional peer dependency "parse-ingredient". Install it before enabling parseIngredients.',
        { cause: error },
      )
    })

  return parseIngredientPromise
}

/**
 * Post-processor plugin that parses ingredient strings into structured data.
 * Uses the parse-ingredient library to extract quantity, unit, and description.
 *
 * @see https://github.com/jakeboone02/parse-ingredient
 */
export class IngredientParserPlugin extends PostProcessorPlugin {
  name = 'IngredientParser'
  priority = 50 // Run after HTML stripping

  constructor(private readonly options: IngredientParserOptions = {}) {
    super()
  }

  shouldProcess<Key extends keyof RecipeFields>(field: Key): boolean {
    return field === 'ingredients'
  }

  async process<T>(field: keyof RecipeFields, value: T): Promise<T> {
    if (!this.shouldProcess(field)) {
      return value
    }

    if (isIngredients(value)) {
      return this.processIngredients(value) as Promise<T>
    }

    return value
  }

  private async processIngredients(ingredients: Ingredients): Promise<Ingredients> {
    const parseIngredient = await loadParseIngredient()

    return ingredients.map((group) => ({
      name: group.name,
      items: group.items.map((item) => this.parseItem(item, parseIngredient)),
    }))
  }

  private parseItem(item: IngredientItem, parseIngredient: ParseIngredient): IngredientItem {
    const parsed = parseIngredient(item.value, this.options)

    // parseIngredient returns an array, we take the first result
    // since we're parsing one ingredient at a time
    const parsedIngredient = parsed[0] ?? null

    return {
      value: item.value,
      parsed: parsedIngredient,
    }
  }
}
