import { AbstractScraper } from '@/abstract-scraper'

export class Food52 extends AbstractScraper {
  static host() {
    return 'food52.com'
  }

  extractors = {}
}
