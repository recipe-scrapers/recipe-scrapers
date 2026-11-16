import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { recoverIngredientGroups, stringsToIngredients } from '@/utils/ingredients'
import { normalizeString } from '@/utils/parsing'

const INGREDIENT_GROUP_STRUCTURE = {
  heading: '.structured-ingredients__list-heading',
  item: '.structured-ingredients__list-item',
}

export class TheSpruceEats extends AbstractScraper {
  static host() {
    return 'thespruceeats.com'
  }

  protected override readonly extractors = {
    ingredients: this.ingredients.bind(this),
  } satisfies ScraperExtractors

  /**
   * The Spruce Eats JSON-LD ingredients can lag behind the ingredient list
   * shown on the page, so the page's list is authoritative when present.
   */
  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    const values = this.$(INGREDIENT_GROUP_STRUCTURE.item)
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter((value) => value.length > 0)

    return recoverIngredientGroups(
      this.$,
      values.length > 0 ? stringsToIngredients(values) : prevValue,
      INGREDIENT_GROUP_STRUCTURE,
    )
  }
}
