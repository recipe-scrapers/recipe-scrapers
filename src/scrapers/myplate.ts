import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { NoIngredientsFoundException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { texts } from '@/utils/dom'
import { stringsToIngredients } from '@/utils/ingredients'
import { normalizeString, parseMinutes } from '@/utils/parsing'

export class MyPlate extends AbstractScraper {
  static host() {
    return 'myplate.gov'
  }

  protected override readonly extractors = {
    cookTime: this.cookTime.bind(this),
    ingredients: this.ingredients.bind(this),
    prepTime: this.prepTime.bind(this),
    totalTime: this.totalTime.bind(this),
  } satisfies ScraperExtractors

  protected override readonly instructionStructure = {
    item: '.field--name-field-instructions li',
    fallbackOnly: true,
  }

  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    if (prevValue && prevValue.length > 0) {
      return prevValue
    }

    const values = texts(this.$, '.field--name-field-ingredients li.field__item')

    if (values.length === 0) {
      throw new NoIngredientsFoundException()
    }

    return stringsToIngredients(values)
  }

  protected cookTime(prevValue: RecipeFields['cookTime'] | undefined): RecipeFields['cookTime'] {
    return this.readDuration(
      '.mp-recipe-full__detail--cook-time .mp-recipe-full__detail--data',
      prevValue,
    )
  }

  protected prepTime(prevValue: RecipeFields['prepTime'] | undefined): RecipeFields['prepTime'] {
    return this.readDuration(
      '.mp-recipe-full__detail--prep-time .mp-recipe-full__detail--data',
      prevValue,
    )
  }

  protected totalTime(prevValue: RecipeFields['totalTime'] | undefined): RecipeFields['totalTime'] {
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

  private readDuration(selector: string, fallback: number | null | undefined): number | null {
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
