import { AbstractScraper } from '@/abstract-scraper'
import { normalizeString } from '@/utils/parsing'

/**
 * WP Recipe Maker list items the site uses as Ingredient Group headings: a
 * bold name with no amount or unit, such as "For the noodles:".
 */
const GROUP_HEADING =
  '.wprm-recipe-ingredient:has(.wprm-recipe-ingredient-name strong):not(:has(.wprm-recipe-ingredient-amount, .wprm-recipe-ingredient-unit))'

export class AmbitiousKitchen extends AbstractScraper {
  static host() {
    return 'ambitiouskitchen.com'
  }

  #groupHeadings: Set<string> | null = null

  protected override readonly ingredientGroupStructure = {
    heading: GROUP_HEADING,
    item: `.wprm-recipe-ingredient:not(${GROUP_HEADING})`,
    excludeSource: (value: string) => this.groupHeadings().has(normalizeString(value)),
  }

  /** Text of the list items that act as Ingredient Group headings. */
  private groupHeadings(): Set<string> {
    this.#groupHeadings ??= new Set(
      this.$(GROUP_HEADING)
        .toArray()
        .map((element) => normalizeString(this.$(element).text())),
    )

    return this.#groupHeadings
  }
}
