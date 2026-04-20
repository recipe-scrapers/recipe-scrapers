import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { NoIngredientsFoundException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { flattenIngredients, groupIngredients } from '@/utils/ingredients'

export class InspiredTaste extends AbstractScraper {
  static host() {
    return 'inspiredtaste.net'
  }

  protected override readonly extractors = {
    ingredients: this.ingredients.bind(this),
    siteName: this.siteName.bind(this),
  } satisfies ScraperExtractors

  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    const headingSelector = '.ingredient_heading'
    const ingredientSelector = '.itr-ingredients p'

    if (prevValue && prevValue.length > 0) {
      const values = flattenIngredients(prevValue)

      return groupIngredients(
        this.$,
        values,
        headingSelector,
        ingredientSelector,
      )
    }

    throw new NoIngredientsFoundException()
  }

  protected siteName(
    _prevValue: RecipeFields['siteName'] | undefined,
  ): RecipeFields['siteName'] {
    return 'Inspired Taste'
  }
}
