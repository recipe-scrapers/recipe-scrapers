import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { NoIngredientsFoundException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { flattenIngredients, groupIngredients } from '@/utils/ingredients'
import { createInstructionGroup, createInstructionItem } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

/**
 * Filters out ingredient group headers from a list of ingredient values.
 * SimplyRecipes JSON-LD includes group headers (like "For the roasted
 * parsnips:") as regular ingredients, so we need to remove them.
 */
function filterGroupHeaders(values: string[]): string[] {
  // Group headers typically start with "For " and end with ":"
  return values.filter((value) => {
    const trimmed = value.trim().toLowerCase()
    return !(trimmed.startsWith('for ') && trimmed.endsWith(':'))
  })
}

export class SimplyRecipes extends AbstractScraper {
  static host() {
    return 'simplyrecipes.com'
  }

  protected override readonly extractors = {
    ingredients: this.ingredients.bind(this),
    instructions: this.instructions.bind(this),
  } satisfies ScraperExtractors

  /**
   * Parse ingredients from HTML using structured ingredients selectors.
   * Filters out group headers that schema-org includes as ingredients.
   */
  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    const headingSelector = '.structured-ingredients__list-heading'
    const ingredientSelector = '.structured-ingredients__list-item'

    if (prevValue && prevValue.length > 0) {
      // Get values and filter out group headers that JSON-LD includes
      const rawValues = flattenIngredients(prevValue)
      const values = filterGroupHeaders(rawValues)

      return groupIngredients(this.$, values, headingSelector, ingredientSelector)
    }

    throw new NoIngredientsFoundException()
  }

  /**
   * Extract and normalize each step under
   * div.structured-project__steps > ol > li
   */
  protected instructions(): RecipeFields['instructions'] {
    // select all <li> under the steps container
    const items = this.$('div.structured-project__steps ol li').toArray()

    if (items.length === 0) {
      return []
    }

    const steps = items
      .map((el) => {
        // clone & strip images/figures before grabbing text
        const $clone = this.$(el).clone()
        $clone.find('img, picture, figure').remove()
        return normalizeString($clone.text())
      })
      .filter((text) => text.length > 0)
      .map(createInstructionItem)

    return [createInstructionGroup(null, steps)]
  }
}
