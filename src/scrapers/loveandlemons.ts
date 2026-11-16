import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { texts } from '@/utils/dom'
import { recoverIngredientGroups, stringsToIngredients } from '@/utils/ingredients'

const INGREDIENT_GROUPS = {
  heading: '.wprm-recipe-ingredient-group-name',
  item: '.wprm-recipe-ingredient',
}

export class LoveAndLemons extends AbstractScraper {
  static host() {
    return 'loveandlemons.com'
  }

  protected override readonly extractors = {
    ingredients: this.ingredients.bind(this),
  } satisfies ScraperExtractors

  /**
   * Reads ingredients from the Recipe Page, because the Structured Data
   * splits some lines in two ("Sea salt and freshly ground black pepper"
   * becomes "Sea salt" and "Freshly ground black pepper") and wraps notes in
   * parentheses where the page shows them after a comma.
   */
  protected ingredients(): RecipeFields['ingredients'] {
    const values = texts(this.$, INGREDIENT_GROUPS.item)

    return recoverIngredientGroups(this.$, stringsToIngredients(values), INGREDIENT_GROUPS)
  }
}
