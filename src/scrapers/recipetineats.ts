import { AbstractScraper } from '@/abstract-scraper'

export class RecipeTinEats extends AbstractScraper {
  static host() {
    return 'recipetineats.com'
  }

  extractors = {}
}
