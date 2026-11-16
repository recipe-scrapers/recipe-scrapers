import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { texts } from '@/utils/dom'
import { groupIngredients } from '@/utils/ingredients'

const INGREDIENT_HEADING = 'div.mb-10 > p.h29'
const INGREDIENT_ITEM = 'div.mb-10 > ul.h29 > li'

export class BarefootContessa extends AbstractScraper {
  static host() {
    return 'barefootcontessa.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
    ingredients: this.ingredients.bind(this),
  } satisfies ScraperExtractors

  /**
   * On recipes with a sub-recipe, the Structured Data holds only the last
   * method block, so the paragraphs of every method block are read instead.
   */
  protected override readonly instructionStructure = {
    item: 'div.EntryPost__text p',
  }

  /** Every recipe on the site is Ina Garten's; the Structured Data names no author. */
  protected author(prevValue: RecipeFields['author'] | undefined): RecipeFields['author'] {
    return prevValue || 'Ina Garten'
  }

  /**
   * The Structured Data joins all ingredients into one string, so they are
   * read from the page's ingredient lists, grouped under any list heading.
   */
  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    const values = texts(this.$, INGREDIENT_ITEM)

    return values.length > 0
      ? groupIngredients(this.$, values, INGREDIENT_HEADING, INGREDIENT_ITEM)
      : (prevValue ?? [])
  }
}
