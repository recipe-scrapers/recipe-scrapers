import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { ExtractionFailedException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { parseYields } from '@/utils/parse-yields'
import { normalizeString } from '@/utils/parsing'

export class GreatBritishChefs extends AbstractScraper {
  static host() {
    return 'greatbritishchefs.com'
  }

  protected override readonly extractors = {
    yields: this.yields.bind(this),
  } satisfies ScraperExtractors

  /**
   * The Structured Data has no `recipeYield`; the page shows the servings
   * beside a "serves" icon in the recipe summary.
   */
  protected yields(prevValue: RecipeFields['yields'] | undefined): RecipeFields['yields'] {
    if (prevValue) {
      return prevValue
    }

    const serves = normalizeString(this.$('.gbcicon-serves').first().parent().text())

    if (!serves) {
      throw new ExtractionFailedException('yields')
    }

    return parseYields(serves)
  }
}
