import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { ExtractionFailedException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { parseYields } from '@/utils/parse-yields'
import { normalizeString } from '@/utils/parsing'

/** Recipe details labels whose value states how much the recipe makes. */
const YIELD_LABELS = new Set(['Servings:', 'Yield:'])

/**
 * Shared base for Dotdash Meredith Hosts built on the `mntl-recipe-details`
 * template, whose Structured Data often omits `recipeYield` while the page's
 * recipe details box still shows it.
 */
export abstract class DotdashMeredithScraper extends AbstractScraper {
  protected override readonly extractors = {
    yields: this.yields.bind(this),
  } satisfies ScraperExtractors

  /**
   * Keeps the Structured Data yield, falling back to the first "Servings:" or
   * "Yield:" entry in the recipe details box.
   */
  protected yields(prevValue: RecipeFields['yields'] | undefined): RecipeFields['yields'] {
    if (prevValue) {
      return prevValue
    }

    for (const item of this.$('.mntl-recipe-details__item').toArray()) {
      const $item = this.$(item)
      const label = normalizeString($item.find('.mntl-recipe-details__label').text())
      const value = normalizeString($item.find('.mntl-recipe-details__value').text())

      if (YIELD_LABELS.has(label) && value) {
        return parseYields(value)
      }
    }

    throw new ExtractionFailedException('yields')
  }
}
