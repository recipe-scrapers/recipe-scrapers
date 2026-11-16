import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { normalizeString } from '@/utils/parsing'

export class PurpleCarrot extends AbstractScraper {
  static host() {
    return 'purplecarrot.com'
  }

  protected override readonly extractors = {
    siteName: this.siteName.bind(this),
  } satisfies ScraperExtractors

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
