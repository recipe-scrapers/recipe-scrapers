import { AbstractScraper } from '@/abstract-scraper'

export class PinchOfYum extends AbstractScraper {
  static host() {
    return 'pinchofyum.com'
  }

  extractors = {}
}
