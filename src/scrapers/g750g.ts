import { AbstractScraper } from '@/abstract-scraper'

export class G750g extends AbstractScraper {
  static host() {
    return '750g.com'
  }

  extractors = {}
}
