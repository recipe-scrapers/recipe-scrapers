import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'

export class DamnDelicious extends AbstractScraper {
  static host() {
    return 'damndelicious.net'
  }

  protected override readonly extractors = {
    siteName: this.siteName.bind(this),
  } satisfies ScraperExtractors

  protected siteName(
    _prevValue: RecipeFields['siteName'] | undefined,
  ): RecipeFields['siteName'] {
    return 'Damn Delicious'
  }
}
