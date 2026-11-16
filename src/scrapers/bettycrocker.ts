import { AbstractScraper } from '@/abstract-scraper'

export class BettyCrocker extends AbstractScraper {
  static host() {
    return 'bettycrocker.com'
  }

  protected override readonly ingredientGroupStructure = {
    heading: '.recipeIngredients h3',
    item: '.recipeIngredients li',
  }
}
