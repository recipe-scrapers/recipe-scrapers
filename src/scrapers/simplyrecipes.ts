import { AbstractScraper } from '@/abstract-scraper'

/**
 * SimplyRecipes JSON-LD includes Ingredient Group headers (like "For the
 * roasted parsnips:") as regular ingredients, so they need to be excluded.
 */
function isGroupHeader(value: string): boolean {
  // Group headers typically start with "For " and end with ":"
  const trimmed = value.trim().toLowerCase()
  return trimmed.startsWith('for ') && trimmed.endsWith(':')
}

export class SimplyRecipes extends AbstractScraper {
  static host() {
    return 'simplyrecipes.com'
  }

  protected override readonly ingredientGroupStructure = {
    heading: '.structured-ingredients__list-heading',
    item: '.structured-ingredients__list-item',
    excludeSource: isGroupHeader,
  }

  /** Each step in the steps list, without its photos. */
  protected override readonly instructionStructure = {
    item: 'div.structured-project__steps ol li',
    exclude: 'img, picture, figure',
  }
}
