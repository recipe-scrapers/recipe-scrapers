import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { ExtractionFailedException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { stringsToInstructions } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

/**
 * Scraper for purplecarrot.com. The Structured Data gives each step only its
 * title ("Start the lentils."), so the directions are read from the page.
 */
export class PurpleCarrot extends AbstractScraper {
  static host() {
    return 'purplecarrot.com'
  }

  protected override readonly extractors = {
    instructions: this.instructions.bind(this),
    siteName: this.siteName.bind(this),
  } satisfies ScraperExtractors

  /**
   * Reads each step's paragraphs under its numbered title, falling back to
   * the Structured Data titles when the page has none.
   */
  protected instructions(
    prevValue: RecipeFields['instructions'] | undefined,
  ): RecipeFields['instructions'] {
    const steps = this.$('.c-recipe-step > p')
      .toArray()
      .map((paragraph) => normalizeString(this.$(paragraph).text()))
      .filter(Boolean)

    if (steps.length > 0) {
      return stringsToInstructions(steps)
    }

    if (prevValue) {
      return prevValue
    }

    throw new ExtractionFailedException('instructions')
  }

  /**
   * Reads the site name from the title of the header's home link, since the
   * page declares no `og:site_name`.
   */
  protected siteName(prevValue: RecipeFields['siteName'] | undefined): RecipeFields['siteName'] {
    if (prevValue) {
      return prevValue
    }

    return normalizeString(this.$('a[href="/"][title]').first().attr('title')) || null
  }
}
