import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'

export class InspiredTaste extends AbstractScraper {
  static host() {
    return 'inspiredtaste.net'
  }

  protected override readonly extractors = {
    siteName: this.siteName.bind(this),
  } satisfies ScraperExtractors

  protected override readonly ingredientGroupStructure = {
    heading: '.ingredient_heading',
    item: '.itr-ingredients p',
  }

  protected siteName(_prevValue: RecipeFields['siteName'] | undefined): RecipeFields['siteName'] {
    return 'Inspired Taste'
  }
}
