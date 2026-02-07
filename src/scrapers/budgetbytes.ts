import { AbstractScraper } from '@/abstract-scraper'

export class BudgetBytes extends AbstractScraper {
  static host() {
    return 'budgetbytes.com'
  }

  extractors = {}
}
