import { AbstractScraper } from '@/abstract-scraper'

export class CookPad extends AbstractScraper {
  static host() {
    return 'cookpad.com'
  }

  extractors = {}
}
