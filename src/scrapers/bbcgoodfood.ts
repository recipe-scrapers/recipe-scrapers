import { AbstractScraper } from '@/abstract-scraper'

export class BBCGoodFood extends AbstractScraper {
  static host() {
    return 'bbcgoodfood.com'
  }

  protected override readonly ingredientGroupStructure = {
    heading: '.recipe__ingredients h3',
    item: '.recipe__ingredients li',
  }
}
