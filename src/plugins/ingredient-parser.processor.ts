import { type ParseIngredientOptions, parseIngredient } from 'parse-ingredient'
import { PostProcessorPlugin } from '@/abstract-postprocessor-plugin'
import type {
  IngredientItem,
  Ingredients,
  RecipeFields,
} from '@/types/recipe.interface'
import { isIngredients } from '@/utils/ingredients'

/**
 * Post-processor plugin that parses ingredient strings into structured data.
 * Uses the parse-ingredient library to extract quantity, unit, and description.
 *
 * @see https://github.com/jakeboone02/parse-ingredient
 */
export class IngredientParserPlugin extends PostProcessorPlugin {
  name = 'IngredientParser'
  priority = 50 // Run after HTML stripping

  constructor(private readonly options: ParseIngredientOptions = {}) {
    super()
  }

  shouldProcess<Key extends keyof RecipeFields>(field: Key): boolean {
    return field === 'ingredients'
  }

  process<T>(field: keyof RecipeFields, value: T): T {
    if (!this.shouldProcess(field)) {
      return value
    }

    if (isIngredients(value)) {
      return this.processIngredients(value) as T
    }

    return value
  }

  private processIngredients(ingredients: Ingredients): Ingredients {
    return ingredients.map((group) => ({
      name: group.name,
      items: group.items.map((item) => this.parseItem(item)),
    }))
  }

  private parseItem(item: IngredientItem): IngredientItem {
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
