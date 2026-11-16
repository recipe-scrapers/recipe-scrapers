import { AbstractScraper } from '@/abstract-scraper'

/** Scraper for mccormick.com, restoring Ingredient Groups from the Recipe Page. */
export class McCormick extends AbstractScraper {
  static host() {
    return 'mccormick.com'
  }

  protected override readonly ingredientGroupStructure = {
    heading: '.recipe-about-list .substitutions-title',
    item: '.recipe-about-list li:not(.substitutions-title):not(.substitutions-content li)',
  }
}
