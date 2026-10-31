import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { stringsToInstructions } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

/**
 * SimplyRecipes JSON-LD includes Ingredient Group headers (like "For the
 * roasted parsnips:") as regular ingredients, so they need to be excluded.
 */
function isGroupHeader(value: string): boolean {
  // Group headers typically start with "For " and end with ":"
  const trimmed = value.trim().toLowerCase()
  return trimmed.startsWith('for ') && trimmed.endsWith(':')
}

export class SimplyRecipes extends AbstractScraper {
  static host() {
    return 'simplyrecipes.com'
  }

  protected override readonly extractors = {
    instructions: this.instructions.bind(this),
  } satisfies ScraperExtractors

  protected override readonly ingredientGroupStructure = {
    heading: '.structured-ingredients__list-heading',
    item: '.structured-ingredients__list-item',
    excludeSource: isGroupHeader,
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

    return stringsToInstructions(steps)
  }
}
