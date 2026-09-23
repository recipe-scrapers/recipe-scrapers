import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { stringsToIngredients } from '@/utils/ingredients'
import { stringsToInstructions } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

export class BongEats extends AbstractScraper {
  static host() {
    return 'bongeats.com'
  }

  protected override readonly extractors = {
    ingredients: this.ingredients.bind(this),
    instructions: this.instructions.bind(this),
  } satisfies ScraperExtractors

  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    if (prevValue && prevValue.length > 0) {
      return prevValue
    }

    const values = this.$('.recipe-ingredients li')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter((value) => value.length > 0)

    if (values.length === 0) {
      throw new Error('Failed to extract ingredients')
    }

    return stringsToIngredients(values)
  }

  protected instructions(
    prevValue: RecipeFields['instructions'] | undefined,
  ): RecipeFields['instructions'] {
    if (prevValue && prevValue.length > 0) {
      return prevValue
    }

    const values = this.$('.recipe-process li')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter((value) => value.length > 0)

    if (values.length === 0) {
      throw new Error('Failed to extract instructions')
    }

    return stringsToInstructions(values)
  }
}
