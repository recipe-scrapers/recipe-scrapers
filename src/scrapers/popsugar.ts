import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { IngredientGroup, RecipeFields } from '@/types/recipe.interface'
import { createIngredientGroup, createIngredientItem } from '@/utils/ingredients'
import { normalizeString } from '@/utils/parsing'

/** Strips the colon that follows an Ingredient Group heading. */
function stripColon(value: string): string {
  return normalizeString(value.replace(/^:|:$/g, ''))
}

export class PopSugar extends AbstractScraper {
  static host() {
    return 'popsugar.com'
  }

  protected override readonly extractors = {
    ingredients: this.ingredients.bind(this),
  } satisfies ScraperExtractors

  /**
   * Reads the recipe card's ingredient lists, where each list item holds an
   * optional bold Ingredient Group heading followed by `<br>`-separated
   * ingredients. The Structured Data lists those headings as ingredients.
   */
  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    const section = this.$('.recipe-card h3.recipe-section-title')
      .filter((_, element) => normalizeString(this.$(element).text()) === 'Ingredients')
      .first()
      .parent()
    const groups: IngredientGroup[] = []

    for (const element of section.find('li').toArray()) {
      const $item = this.$(element).clone()
      const $heading = $item.children('b, strong').first()
      const name = stripColon($heading.text()) || null

      $heading.remove()
      $item.find('br').replaceWith('\n')

      const items = $item
        .text()
        .split('\n')
        .map(stripColon)
        .filter((value) => value.length > 0)
        .map(createIngredientItem)

      if (items.length === 0) {
        continue
      }

      const previous = groups.at(-1)

      if (previous && previous.name === name) {
        previous.items.push(...items)
      } else {
        groups.push(createIngredientGroup(name, items))
      }
    }

    if (groups.length > 0) {
      return groups
    }

    if (prevValue && prevValue.length > 0) {
      return prevValue
    }

    throw new Error('Failed to extract ingredients')
  }
}
