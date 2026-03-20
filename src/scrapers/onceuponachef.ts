import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { normalizeString } from '@/utils/parsing'

export class OnceUponAChef extends AbstractScraper {
  static host() {
    return 'onceuponachef.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
  } satisfies ScraperExtractors

  protected author(
    prevValue: RecipeFields['author'] | undefined,
  ): RecipeFields['author'] {
    if (prevValue && normalizeString(prevValue)) {
      return prevValue
    }

    const author = normalizeString(
      this.$('meta[name="author"]').attr('content') ??
        this.$('meta[name="twitter:data1"]').attr('content'),
    )

    if (!author) {
      throw new Error('Failed to extract author')
    }

    return author
  }
}
