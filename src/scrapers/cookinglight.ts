import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { stringsToInstructions } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

export class CookingLight extends AbstractScraper {
  static host() {
    return 'cookinglight.com'
  }

  protected override readonly extractors = {
    instructions: this.instructions.bind(this),
  } satisfies ScraperExtractors

  /**
   * Reads one step per "Step N" block on the page, since the Structured Data
   * publishes every step as a single run of sentences.
   */
  protected instructions(
    prevValue: RecipeFields['instructions'] | undefined,
  ): RecipeFields['instructions'] {
    const steps = this.$('.recipe-instructions .step .paragraph')
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
