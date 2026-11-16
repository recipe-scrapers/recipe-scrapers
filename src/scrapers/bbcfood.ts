import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { normalizeString } from '@/utils/parsing'

export class BBCFood extends AbstractScraper {
  static host() {
    return 'bbc.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
  } satisfies ScraperExtractors

  protected override readonly ingredientGroupStructure = {
    heading: '.recipe-ingredients__sub-heading, [data-testid="recipe-ingredients"] > h3',
    item: '.recipe-ingredients__list-item, [data-testid="recipe-ingredients"] li',
  }

  /**
   * The microdata author is a link, whose value is the chef page's URL, so
   * the chef's name is read from the link text.
   */
  protected author(prevValue: RecipeFields['author'] | undefined): RecipeFields['author'] {
    return normalizeString(this.$('[itemprop="author"]').first().text()) || prevValue || ''
  }
}
