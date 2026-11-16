import { AbstractScraper } from '@/abstract-scraper'

export class TasteAU extends AbstractScraper {
  static host() {
    return 'taste.com.au'
  }

  protected override readonly ingredientGroupStructure = {
    heading: 'li.section-heading h3',
    item: 'div.ingredient-description',
  }
}
