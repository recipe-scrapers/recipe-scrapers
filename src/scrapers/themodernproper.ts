import { AbstractScraper } from '@/abstract-scraper'

/** Scraper for themodernproper.com, restoring Ingredient Groups from the Recipe Page. */
export class TheModernProper extends AbstractScraper {
  static host() {
    return 'themodernproper.com'
  }

  protected override readonly ingredientGroupStructure = {
    heading: '.recipe-ingredients__list-title',
    item: '.recipe-ingredients__item',
  }
}
