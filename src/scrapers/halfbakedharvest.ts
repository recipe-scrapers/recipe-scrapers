import { AbstractScraper } from '@/abstract-scraper'

export class HalfBakedHarvest extends AbstractScraper {
  static host() {
    return 'halfbakedharvest.com'
  }

  extractors = {}
}
