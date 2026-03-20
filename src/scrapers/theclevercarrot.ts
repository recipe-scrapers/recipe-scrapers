import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { normalizeString } from '@/utils/parsing'

export class TheCleverCarrot extends AbstractScraper {
  static host() {
    return 'theclevercarrot.com'
  }

  protected override readonly extractors = {
    description: this.description.bind(this),
  } satisfies ScraperExtractors

  protected description(
    prevValue: RecipeFields['description'] | undefined,
  ): RecipeFields['description'] {
    if (prevValue && normalizeString(prevValue)) {
      return prevValue
    }

    const description =
      this.$('meta[name="description"]').attr('content') ??
      this.$('meta[property="og:description"]').attr('content') ??
      this.$('.tasty-recipes-description-body').html() ??
      null

    const normalized = normalizeString(description)

    if (!description || !normalized) {
      throw new Error('Failed to extract description')
    }

    return description
  }
}
