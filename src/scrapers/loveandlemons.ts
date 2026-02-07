import { AbstractScraper } from '@/abstract-scraper'

export class LoveAndLemons extends AbstractScraper {
  static host() {
    return 'loveandlemons.com'
  }

  extractors = {}
}
