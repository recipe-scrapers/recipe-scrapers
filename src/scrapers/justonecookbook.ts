import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { Ingredients, RecipeFields } from '@/types/recipe.interface'
import { createIngredientGroup, createIngredientItem } from '@/utils/ingredients'
import { normalizeString } from '@/utils/parsing'

export class JustOneCookbook extends AbstractScraper {
  static host() {
    return 'justonecookbook.com'
  }

  protected override readonly extractors = {
    ingredients: this.ingredients.bind(this),
  } satisfies ScraperExtractors

  /**
   * WP Recipe Maker leaves out ingredient notes that use its `[adjustable]`
   * shortcode from the Structured Data, so the ingredients are read from the
   * page, whose WP Recipe Maker groups also supply the group names.
   */
  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    const groups: Ingredients = []

    for (const group of this.$('.wprm-recipe-ingredient-group').toArray()) {
      const $group = this.$(group)
      const name = normalizeString($group.find('.wprm-recipe-group-name').first().text()) || null
      const items = $group
        .find('li.wprm-recipe-ingredient')
        .toArray()
        .map((item) => {
          const $item = this.$(item).clone()
          $item.find('.wprm-checkbox-container').remove()
          return normalizeString($item.text())
        })
        .filter(Boolean)
        .map(createIngredientItem)

      if (items.length > 0) {
        groups.push(createIngredientGroup(name, items))
      }
    }

    if (groups.length > 0) {
      return groups
    }

    if (prevValue) {
      return prevValue
    }

    throw new Error('Failed to extract ingredients')
  }
}
