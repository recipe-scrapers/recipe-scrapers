import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { ExtractionFailedException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { createInstructionGroup, createInstructionItem } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

/**
 * Scraper for iowagirleats.com (WP Recipe Maker). The Structured Data gives
 * every step a short `name` ("Mix", "Cook beef") that the Recipe Page never
 * shows, so instructions are read from the page instead.
 */
export class IowaGirlEats extends AbstractScraper {
  static host() {
    return 'iowagirleats.com'
  }

  protected override readonly extractors = {
    instructions: this.instructions.bind(this),
  } satisfies ScraperExtractors

  protected instructions(): RecipeFields['instructions'] {
    const groups = this.$('.wprm-recipe-instruction-group')
      .toArray()
      .map((element) => {
        const $group = this.$(element)
        const name = normalizeString(
          $group.find('.wprm-recipe-instruction-group-name').first().text(),
        ).replace(/:$/, '')
        const items = $group
          .find('.wprm-recipe-instruction-text')
          .toArray()
          .map((step) => normalizeString(this.$(step).text()))
          .filter(Boolean)
          .map(createInstructionItem)

        return createInstructionGroup(name || null, items)
      })
      .filter((group) => group.items.length > 0)

    if (groups.length === 0) {
      throw new ExtractionFailedException('instructions')
    }

    return groups
  }
}
