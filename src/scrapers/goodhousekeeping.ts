import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { normalizeString } from '@/utils/parsing'

import { HEARST_INGREDIENT_GROUPS, hearstInstructions, hearstKeywords } from './hearst'

/** Nutrient labels in the page's "Per serving" block, keyed by Schema.org property. */
const NUTRIENT_LABELS: ReadonlyArray<readonly [string, RegExp]> = [
  ['calories', /^calories$/i],
  ['fatContent', /^(?:total )?fat$/i],
  ['saturatedFatContent', /^(?:saturates|sat(?:urated)? fat)$/i],
  ['carbohydrateContent', /^(?:total )?carb(?:ohydrate)?s$/i],
  ['sugarContent', /^(?:total )?sugars?$/i],
  ['proteinContent', /^protein$/i],
  ['fiberContent', /^fib(?:er|re)$/i],
]

export class GoodHousekeeping extends AbstractScraper {
  static host() {
    return 'goodhousekeeping.com'
  }

  protected override readonly extractors = {
    instructions: this.instructions.bind(this),
    keywords: this.keywords.bind(this),
    nutrients: this.nutrients.bind(this),
  } satisfies ScraperExtractors

  protected override readonly ingredientGroupStructure = HEARST_INGREDIENT_GROUPS

  protected instructions(
    prevValue: RecipeFields['instructions'] | undefined,
  ): RecipeFields['instructions'] {
    return hearstInstructions(this.$, prevValue)
  }

  protected keywords(prevValue: RecipeFields['keywords'] | undefined): RecipeFields['keywords'] {
    return hearstKeywords(prevValue)
  }

  /**
   * Structured Data usually carries only calories, so read the "Per
   * serving" lines ("Fat: 35g") the article body prints after the method.
   */
  protected nutrients(prevValue: RecipeFields['nutrients'] | undefined): RecipeFields['nutrients'] {
    const nutrients: RecipeFields['nutrients'] = new Map(prevValue)

    for (const element of this.$('.recipe-body-content').find('p, li').toArray()) {
      const [, label = '', amount = ''] =
        /^([^:]+):(.+)$/.exec(normalizeString(this.$(element).text())) ?? []
      const key = NUTRIENT_LABELS.find(([, pattern]) => pattern.test(label.trim()))?.[0]

      if (key && amount.trim()) {
        nutrients.set(key, amount.trim())
      }
    }

    return nutrients
  }
}
