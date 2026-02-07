import { AbstractScraper } from '@/abstract-scraper'

export class BonAppetit extends AbstractScraper {
  static host() {
    return 'bonappetit.com'
  }

  extractors = {}
}
