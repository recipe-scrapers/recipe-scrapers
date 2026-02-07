import { AbstractScraper } from '@/abstract-scraper'

export class Marmiton extends AbstractScraper {
  static host() {
    return 'marmiton.org'
  }

  extractors = {}
}
