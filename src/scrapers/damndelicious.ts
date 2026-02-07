import { AbstractScraper } from '@/abstract-scraper'

export class DamnDelicious extends AbstractScraper {
  static host() {
    return 'damndelicious.net'
  }

  extractors = {}
}
