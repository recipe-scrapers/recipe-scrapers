import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import {
  createIngredientGroup,
  createIngredientItem,
} from '@/utils/ingredients'
import {
  createInstructionGroup,
  createInstructionItem,
} from '@/utils/instructions'
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

    const items = this.$('.recipe-ingredients li')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter((value) => value.length > 0)
      .map(createIngredientItem)

    if (items.length === 0) {
      throw new Error('Failed to extract ingredients')
    }

    return [createIngredientGroup(null, items)]
  }

  protected instructions(
    prevValue: RecipeFields['instructions'] | undefined,
  ): RecipeFields['instructions'] {
    if (prevValue && prevValue.length > 0) {
      return prevValue
    }

    const items = this.$('.recipe-process li')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter((value) => value.length > 0)
      .map(createInstructionItem)

    if (items.length === 0) {
      throw new Error('Failed to extract instructions')
    }

    return [createInstructionGroup(null, items)]
  }
}
