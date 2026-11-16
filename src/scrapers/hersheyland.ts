import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { ExtractionFailedException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { normalizeString } from '@/utils/parsing'

const SITE_NAME = 'Hersheyland'

/**
 * Scraper for hersheyland.com. The Structured Data names neither an author
 * nor a site, and the equipment list appears only on the page.
 */
export class HersheyLand extends AbstractScraper {
  static host() {
    return 'hersheyland.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
    equipment: this.equipment.bind(this),
    siteName: this.siteName.bind(this),
  } satisfies ScraperExtractors

  /** Recipes are published by Hershey's own Hersheyland site. */
  protected author(prevValue: RecipeFields['author'] | undefined): RecipeFields['author'] {
    return prevValue || SITE_NAME
  }

  protected siteName(prevValue: RecipeFields['siteName'] | undefined): RecipeFields['siteName'] {
    return prevValue || SITE_NAME
  }

  /** Reads the "Equipment Needed" list above the directions. */
  protected equipment(): RecipeFields['equipment'] {
    const names = this.$('.equipment-item span.h6')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter(Boolean)

    if (names.length === 0) {
      throw new ExtractionFailedException('equipment')
    }

    return new Set(names)
  }
}
