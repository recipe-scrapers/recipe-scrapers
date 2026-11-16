import { AbstractScraper } from '@/abstract-scraper'
import { texts } from '@/utils/dom'
import { normalizeString } from '@/utils/parsing'

const INGREDIENT_HEADING = '.ingredients-rich-text p.type-h5'

export class JamieOliver extends AbstractScraper {
  static host() {
    return 'jamieoliver.com'
  }

  /**
   * The JSON-LD joins the steps into one string without separators, so the
   * steps are read from the Method list on the page instead.
   */
  protected override readonly instructionStructure = {
    item: '#method-section ol li',
  }

  /**
   * The JSON-LD lists Ingredient Group headings ("FOR THE MARINADE") as
   * ingredients, so values matching a heading on the page are dropped.
   */
  protected override readonly ingredientGroupStructure = {
    heading: INGREDIENT_HEADING,
    item: '.ingredients-rich-text p.type-body',
    excludeSource: (value: string) => this.ingredientHeadings().has(normalizeString(value)),
  }

  #ingredientHeadings: Set<string> | null = null

  private ingredientHeadings(): Set<string> {
    this.#ingredientHeadings ??= new Set(texts(this.$, INGREDIENT_HEADING))

    return this.#ingredientHeadings
  }
}
