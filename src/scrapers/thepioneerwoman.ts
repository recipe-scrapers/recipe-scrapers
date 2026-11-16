import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'

import { HEARST_INGREDIENT_GROUPS, hearstInstructions, hearstKeywords } from './hearst'

export class ThePioneerWoman extends AbstractScraper {
  static host() {
    return 'thepioneerwoman.com'
  }

  protected override readonly extractors = {
    instructions: this.instructions.bind(this),
    keywords: this.keywords.bind(this),
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
}
