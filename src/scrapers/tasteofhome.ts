import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { stringsToInstructions } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

/**
 * Scraper for tasteofhome.com. The Structured Data publishes the steps as one
 * comma-joined string, so steps come from the Recipe Page's directions list.
 */
export class TasteOfHome extends AbstractScraper {
  static host() {
    return 'tasteofhome.com'
  }

  protected override readonly extractors = {
    instructions: this.instructions.bind(this),
  } satisfies ScraperExtractors

  /**
   * Reads one step per directions list item, keeping the Structured Data
   * steps when the list is missing.
   */
  protected instructions(
    prevValue: RecipeFields['instructions'] | undefined,
  ): RecipeFields['instructions'] {
    const steps = this.$('.recipe-directions__item')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter((value) => value.length > 0)

    if (steps.length > 0) {
      return stringsToInstructions(steps)
    }

    if (prevValue && prevValue.length > 0) {
      return prevValue
    }

    throw new Error('Failed to extract instructions')
  }
}
