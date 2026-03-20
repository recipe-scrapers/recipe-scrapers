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
import { normalizeString, parseMinutes } from '@/utils/parsing'

export class MyPlate extends AbstractScraper {
  static host() {
    return 'myplate.gov'
  }

  protected override readonly extractors = {
    cookTime: this.cookTime.bind(this),
    ingredients: this.ingredients.bind(this),
    instructions: this.instructions.bind(this),
    prepTime: this.prepTime.bind(this),
    totalTime: this.totalTime.bind(this),
  } satisfies ScraperExtractors

  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    if (prevValue && prevValue.length > 0) {
      return prevValue
    }

    const items = this.$('.field--name-field-ingredients li.field__item')
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

    const items = this.$('.field--name-field-instructions li')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter((value) => value.length > 0)
      .map(createInstructionItem)

    if (items.length === 0) {
      throw new Error('Failed to extract instructions')
    }

    return [createInstructionGroup(null, items)]
  }

  protected cookTime(
    prevValue: RecipeFields['cookTime'] | undefined,
  ): RecipeFields['cookTime'] {
    return this.readDuration(
      '.mp-recipe-full__detail--cook-time .mp-recipe-full__detail--data',
      prevValue,
    )
  }

  protected prepTime(
    prevValue: RecipeFields['prepTime'] | undefined,
  ): RecipeFields['prepTime'] {
    return this.readDuration(
      '.mp-recipe-full__detail--prep-time .mp-recipe-full__detail--data',
      prevValue,
    )
  }

  protected totalTime(
    prevValue: RecipeFields['totalTime'] | undefined,
  ): RecipeFields['totalTime'] {
    const cookTime = this.readDuration(
      '.mp-recipe-full__detail--cook-time .mp-recipe-full__detail--data',
      null,
    )
    const prepTime = this.readDuration(
      '.mp-recipe-full__detail--prep-time .mp-recipe-full__detail--data',
      null,
    )

    if (cookTime !== null || prepTime !== null) {
      return (cookTime ?? 0) + (prepTime ?? 0)
    }

    return prevValue ?? null
  }

  private readDuration(
    selector: string,
    fallback: number | null | undefined,
  ): number | null {
    const value = normalizeString(this.$(selector).first().text())

    if (!value) {
      return fallback ?? null
    }

    try {
      return parseMinutes(value)
    } catch {
      return fallback ?? null
    }
  }
}
