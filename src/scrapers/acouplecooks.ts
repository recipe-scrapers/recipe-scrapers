import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { recoverIngredientGroups, stringsToIngredients } from '@/utils/ingredients'
import { normalizeString } from '@/utils/parsing'

const INGREDIENT_GROUPS = {
  heading: '.tasty-recipes-ingredients-body p b',
  item: '.tasty-recipes-ingredients-body ul li',
}

/** Scraper for acouplecooks.com (Tasty Recipes), reading ingredients as the Recipe Page shows them. */
export class ACoupleCooks extends AbstractScraper {
  static host() {
    return 'acouplecooks.com'
  }

  protected override readonly extractors = {
    ingredients: this.ingredients.bind(this),
  } satisfies ScraperExtractors

  /**
   * Reads ingredients from the Recipe Page, because the Structured Data
   * mixes ASCII fractions ("1/2 teaspoon") with the vulgar fractions the page
   * shows ("½ teaspoon").
   */
  protected ingredients(): RecipeFields['ingredients'] {
    const values = this.$(INGREDIENT_GROUPS.item)
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter(Boolean)

    return recoverIngredientGroups(this.$, stringsToIngredients(values), INGREDIENT_GROUPS)
  }
}
