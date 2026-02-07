import { AbstractScraper } from '@/abstract-scraper'

export class Jow extends AbstractScraper {
  static host() {
    return 'jow.fr'
  }

  extractors = {}
}
