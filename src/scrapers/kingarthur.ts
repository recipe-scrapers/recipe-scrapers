import { AbstractScraper } from '@/abstract-scraper'

export class KingArthur extends AbstractScraper {
  static host() {
    return 'kingarthurbaking.com'
  }

  extractors = {}
}
