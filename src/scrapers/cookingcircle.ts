import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { IngredientGroup, RecipeFields } from '@/types/recipe.interface'
import { createIngredientGroup, createIngredientItem } from '@/utils/ingredients'
import { stringsToInstructions } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

/**
 * Scraper for cookingcircle.com (Ninja Test Kitchen). The page only exposes
 * Recipe microdata as `<meta>` tags, where the ingredients are a single
 * comma-joined string and the instructions are an unparsed JSON string, so
 * the author, ingredients, and instructions come from the page.
 */
export class CookingCircle extends AbstractScraper {
  static host() {
    return 'cookingcircle.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
    ingredients: this.ingredients.bind(this),
    instructions: this.instructions.bind(this),
  } satisfies ScraperExtractors

  protected author(prevValue: RecipeFields['author'] | undefined): RecipeFields['author'] {
    const value = normalizeString(this.$('.recipe-author span.text-uppercase').first().text())

    if (value) {
      return value
    }

    if (prevValue && normalizeString(prevValue)) {
      return prevValue
    }

    throw new Error('Failed to extract author')
  }

  /**
   * Reads the metric ingredient list, keeping its "For the ..." headings as
   * Ingredient Groups. The cooking-mode modal repeats the list, so only the
   * first metric group on the page is used.
   */
  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    const container = this.$('.single-ingredients__group[data-unit="metric"]').first()

    const groups = container
      .find('.single-ingredients__item')
      .toArray()
      .map((element): IngredientGroup => {
        const item = this.$(element)
        const name = normalizeString(item.find('.single-ingredients__title').first().text())
        const values = item
          .find('.single-ingredients__list li')
          .toArray()
          .map((li) => normalizeString(this.$(li).text()))
          .filter((value) => value.length > 0)

        return createIngredientGroup(name || null, values.map(createIngredientItem))
      })
      .filter((group) => group.items.length > 0)

    if (groups.length > 0) {
      return groups
    }

    if (prevValue && prevValue.length > 0) {
      return prevValue
    }

    throw new Error('Failed to extract ingredients')
  }

  /**
   * Reads the method steps, dropping the "Step N" label above each one.
   */
  protected instructions(
    prevValue: RecipeFields['instructions'] | undefined,
  ): RecipeFields['instructions'] {
    const values = this.$('ul.single-method__method')
      .first()
      .children('li')
      .toArray()
      .map((element) => {
        const step = this.$(element).clone()
        step.find('h1, h2, h3, h4, h5, h6').remove()
        return normalizeString(step.text())
      })
      .filter((value) => value.length > 0)

    if (values.length > 0) {
      return stringsToInstructions(values)
    }

    if (prevValue && prevValue.length > 0) {
      return prevValue
    }

    throw new Error('Failed to extract instructions')
  }
}
