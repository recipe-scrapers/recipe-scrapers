import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'

export class TheKitchn extends AbstractScraper {
  static host() {
    return 'thekitchn.com'
  }

  protected override readonly extractors = {
    siteName: this.siteName.bind(this),
  } satisfies ScraperExtractors

  protected override readonly ingredientGroupStructure = {
    heading: '.Recipe__ingredientsGroupName',
    item: '.Recipe__ingredient',
  }

  protected siteName(_prevValue: RecipeFields['siteName'] | undefined): RecipeFields['siteName'] {
    return 'The Kitchn'
  }
}
