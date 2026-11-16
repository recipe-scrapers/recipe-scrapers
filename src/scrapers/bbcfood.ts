import { AbstractScraper } from '@/abstract-scraper'

export class BBCFood extends AbstractScraper {
  static host() {
    return 'bbc.com'
  }

  protected override readonly ingredientGroupStructure = {
    heading: '.recipe-ingredients__sub-heading, [data-testid="recipe-ingredients"] > h3',
    item: '.recipe-ingredients__list-item, [data-testid="recipe-ingredients"] li',
  }
}
