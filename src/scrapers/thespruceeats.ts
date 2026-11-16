import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { texts } from '@/utils/dom'
import { recoverIngredientGroups, stringsToIngredients } from '@/utils/ingredients'

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
    const values = texts(this.$, INGREDIENT_GROUP_STRUCTURE.item)

    return recoverIngredientGroups(
      this.$,
      values.length > 0 ? stringsToIngredients(values) : prevValue,
      INGREDIENT_GROUP_STRUCTURE,
    )
  }
}
