import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { ExtractionFailedException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { parseYields } from '@/utils/parse-yields'
import { normalizeString } from '@/utils/parsing'

/** Scraper for forksoverknives.com: author and yield from the Recipe Page. */
export class ForksOverKnives extends AbstractScraper {
  static host() {
    return 'forksoverknives.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
    yields: this.yields.bind(this),
  } satisfies ScraperExtractors

  /**
   * The Recipe Structured Data has no author, so read the byline link to the
   * contributor's profile, skipping the menu link to the contributors index.
   */
  protected author(prevValue: RecipeFields['author'] | undefined): RecipeFields['author'] {
    if (prevValue && normalizeString(prevValue)) {
      return prevValue
    }

    const author = normalizeString(
      this.$('a[href*="/contributors/"]:not([href$="/contributors/"])').first().text(),
    )

    if (!author) {
      throw new ExtractionFailedException('author')
    }

    return author
  }

  /**
   * The Recipe Structured Data has no yield, so read the serving line
   * ("Makes 6 cups") from the recipe info list.
   */
  protected yields(prevValue: RecipeFields['yields'] | undefined): RecipeFields['yields'] {
    if (prevValue) {
      return prevValue
    }

    const value = normalizeString(this.$('.add-info li:has(.icon-serving)').first().text())

    if (!value) {
      throw new ExtractionFailedException('yields')
    }

    return parseYields(value)
  }
}
