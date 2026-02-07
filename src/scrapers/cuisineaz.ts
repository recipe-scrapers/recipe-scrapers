import { AbstractScraper } from '@/abstract-scraper'

export class CuisineAZ extends AbstractScraper {
  static host() {
    return 'cuisineaz.com'
  }

  extractors = {}
}
