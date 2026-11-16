import { AbstractScraper } from '@/abstract-scraper'

import { HEARST_INGREDIENT_GROUPS } from './hearst'

export class Delish extends AbstractScraper {
  static host() {
    return 'delish.com'
  }

  protected override readonly ingredientGroupStructure = HEARST_INGREDIENT_GROUPS
}
