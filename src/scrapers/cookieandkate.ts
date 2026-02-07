import { AbstractScraper } from '@/abstract-scraper'

export class CookieAndKate extends AbstractScraper {
  static host() {
    return 'cookieandkate.com'
  }

  extractors = {}
}
