import { AbstractScraper } from '@/abstract-scraper'

export class MinimalistBaker extends AbstractScraper {
  static host() {
    return 'minimalistbaker.com'
  }

  extractors = {}
}
