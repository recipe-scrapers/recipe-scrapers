import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { stringsToInstructions } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

export class KingArthur extends AbstractScraper {
  static host() {
    return 'kingarthurbaking.com'
  }

  protected override readonly extractors = {
    instructions: this.instructions.bind(this),
  } satisfies ScraperExtractors

  /**
   * The Structured Data instructions are one HTML string of `<p>` steps
   * joined with ", ", which generic splitting breaks apart at sentences.
   * The page lists each step as its own paragraph, beside "Learn more"
   * asides that are not part of the step.
   */
  protected instructions(
    prevValue: RecipeFields['instructions'] | undefined,
  ): RecipeFields['instructions'] {
    const steps = this.$('.field--recipe-steps li > p')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter(Boolean)

    if (steps.length > 0) {
      return stringsToInstructions(steps)
    }

    if (prevValue) {
      return prevValue
    }

    throw new Error('Failed to extract instructions')
  }
}
