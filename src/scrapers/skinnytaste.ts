import { AbstractScraper } from '@/abstract-scraper'

export class SkinnyTaste extends AbstractScraper {
  static host() {
    return 'skinnytaste.com'
  }

  extractors = {}
}
