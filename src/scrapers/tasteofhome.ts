import { AbstractScraper } from '@/abstract-scraper'

/**
 * Scraper for tasteofhome.com. The Structured Data publishes the steps as one
 * comma-joined string, so steps come from the Recipe Page's directions list.
 */
export class TasteOfHome extends AbstractScraper {
  static host() {
    return 'tasteofhome.com'
  }

  protected override readonly instructionStructure = {
    item: '.recipe-directions__item',
  }
}
