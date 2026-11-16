import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { stringsToInstructions } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

const INGREDIENT_HEADING = '.ingredients-rich-text p.type-h5'

export class JamieOliver extends AbstractScraper {
  static host() {
    return 'jamieoliver.com'
  }

  protected override readonly extractors = {
    instructions: this.instructions.bind(this),
  } satisfies ScraperExtractors

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
    this.#ingredientHeadings ??= new Set(
      this.$(INGREDIENT_HEADING)
        .toArray()
        .map((element) => normalizeString(this.$(element).text()))
        .filter(Boolean),
    )

    return this.#ingredientHeadings
  }

  /**
   * The JSON-LD joins the steps into one string without separators, so the
   * steps are read from the Method list on the page instead.
   */
  protected instructions(
    prevValue: RecipeFields['instructions'] | undefined,
  ): RecipeFields['instructions'] {
    const steps = this.$('#method-section ol li')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter(Boolean)

    return steps.length > 0 ? stringsToInstructions(steps) : (prevValue ?? [])
  }
}
