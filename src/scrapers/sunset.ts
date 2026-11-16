import { AbstractScraper } from '@/abstract-scraper'

export class Sunset extends AbstractScraper {
  static host() {
    return 'sunset.com'
  }

  protected override readonly ingredientGroupStructure = {
    heading: '.recipe-ingredients .cooked-heading',
    item: '.recipe-ingredients .cooked-ingredient',
  }
}
