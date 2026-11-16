import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'

/**
 * Scraper for wholefoodsmarket.com. The Structured Data covers every field
 * except the author.
 */
export class WholeFoodsMarket extends AbstractScraper {
  static host() {
    return 'wholefoodsmarket.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
  } satisfies ScraperExtractors

  /** Recipes are published by Whole Foods Market; the Structured Data names no author. */
  protected author(prevValue: RecipeFields['author'] | undefined): RecipeFields['author'] {
    return prevValue || 'Whole Foods Market'
  }
}
