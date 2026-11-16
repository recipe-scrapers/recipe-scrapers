import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { ExtractionFailedException } from '@/exceptions'
import type { InstructionGroup, RecipeFields } from '@/types/recipe.interface'
import { createInstructionGroup, createInstructionItem } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

/**
 * Scraper for bigoven.com. The Structured Data joins every instruction
 * paragraph into one string, so instructions are read from the Recipe Page,
 * where each paragraph is a step and a paragraph ending in a colon ("For the
 * dough:") starts a new Instruction Group.
 */
export class BigOven extends AbstractScraper {
  static host() {
    return 'bigoven.com'
  }

  protected override readonly extractors = {
    instructions: this.instructions.bind(this),
  } satisfies ScraperExtractors

  protected override readonly ingredientGroupStructure = {
    heading: 'span.ingredient.ingHeading',
    item: 'span.ingredient:not(.ingHeading)',
  }

  protected instructions(): RecipeFields['instructions'] {
    const paragraphs = this.$('div.instructions p')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter(Boolean)

    let current = createInstructionGroup(null)
    const groups: InstructionGroup[] = [current]

    for (const paragraph of paragraphs) {
      if (paragraph.endsWith(':')) {
        current = createInstructionGroup(normalizeString(paragraph.slice(0, -1)) || null)
        groups.push(current)
      } else {
        current.items.push(createInstructionItem(paragraph))
      }
    }

    const nonEmptyGroups = groups.filter((group) => group.items.length > 0)

    if (nonEmptyGroups.length === 0) {
      throw new ExtractionFailedException('instructions')
    }

    return nonEmptyGroups
  }
}
