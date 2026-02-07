import { AbstractScraper } from '@/abstract-scraper'

export class Food extends AbstractScraper {
  static host() {
    return 'food.com'
  }

  extractors = {}
}
