import { AbstractScraper } from '@/abstract-scraper'

/**
 * Scraper for cookinglight.com. The Structured Data publishes every step as
 * a single run of sentences, so steps come from the page's "Step N" blocks.
 */
export class CookingLight extends AbstractScraper {
  static host() {
    return 'cookinglight.com'
  }

  protected override readonly instructionStructure = {
    item: '.recipe-instructions .step .paragraph',
  }
}
