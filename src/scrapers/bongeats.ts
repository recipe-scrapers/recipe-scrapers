import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { NoIngredientsFoundException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { texts } from '@/utils/dom'
import { stringsToIngredients } from '@/utils/ingredients'

export class BongEats extends AbstractScraper {
  static host() {
    return 'bongeats.com'
  }

  protected override readonly extractors = {
    ingredients: this.ingredients.bind(this),
  } satisfies ScraperExtractors

  protected override readonly instructionStructure = {
    item: '.recipe-process li',
    fallbackOnly: true,
  }

  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    if (prevValue && prevValue.length > 0) {
      return prevValue
    }

    const values = texts(this.$, '.recipe-ingredients li')

    if (values.length === 0) {
      throw new NoIngredientsFoundException()
    }

    return stringsToIngredients(values)
  }
}
