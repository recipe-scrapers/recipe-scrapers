import { z } from 'zod'

import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { embeddedPayload } from '@/utils/embedded-payload'
import { parseYields } from '@/utils/parse-yields'
import { normalizeString } from '@/utils/parsing'

const ratingValue = z.union([z.string(), z.number()]).optional()

/**
 * The Recipe JSON-LD types its rating as `aggregateRating` (lowercase), which
 * is not the Schema.org `AggregateRating` type, so it is read here directly.
 */
const recipeRatingSchema = z.object({
  aggregateRating: z.object({
    ratingValue,
    ratingCount: ratingValue,
    reviewCount: ratingValue,
  }),
})

export class ForksOverKnives extends AbstractScraper {
  private readonly recipeRating = embeddedPayload(this.$, {
    selector: 'script[type="application/ld+json"]',
    name: 'Forks Over Knives Recipe JSON-LD',
    parse: (data) => recipeRatingSchema.parse(data).aggregateRating,
    logger: this.logger,
  })

  static host() {
    return 'forksoverknives.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
    ratings: this.ratings.bind(this),
    ratingsCount: this.ratingsCount.bind(this),
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
      throw new Error('Failed to extract author')
    }

    return author
  }

  protected ratings(prevValue: RecipeFields['ratings'] | undefined): RecipeFields['ratings'] {
    if (prevValue) {
      return prevValue
    }

    const value = Number.parseFloat(String(this.recipeRating()?.ratingValue ?? ''))

    return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0
  }

  protected ratingsCount(
    prevValue: RecipeFields['ratingsCount'] | undefined,
  ): RecipeFields['ratingsCount'] {
    if (prevValue) {
      return prevValue
    }

    const rating = this.recipeRating()
    const count = Number.parseFloat(String(rating?.ratingCount ?? rating?.reviewCount ?? ''))

    return Number.isFinite(count) ? Math.floor(count) : 0
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
      throw new Error('Failed to extract yields')
    }

    return parseYields(value)
  }
}
