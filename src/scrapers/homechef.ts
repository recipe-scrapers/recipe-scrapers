import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { createInstructionGroup, createInstructionItem } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

/**
 * Home Chef publishes Recipe microdata whose instructions are an `ItemList`
 * of named steps, and whose author includes a "Chef" label, so those fields
 * are read from the markup instead.
 */
export class HomeChef extends AbstractScraper {
  static host() {
    return 'homechef.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
    instructions: this.instructions.bind(this),
  } satisfies ScraperExtractors

  /** Reads the chef's name, skipping the "Chef" label heading above it. */
  protected author(prevValue: RecipeFields['author'] | undefined): RecipeFields['author'] {
    const author = normalizeString(
      this.$('[itemprop="author"] [itemprop="name"] h4').first().text(),
    )

    if (author) return author
    if (prevValue) return prevValue

    throw new Error('Failed to extract author')
  }

  /** Each numbered step becomes an Instruction Group of its paragraphs. */
  protected instructions(): RecipeFields['instructions'] {
    return this.$('[itemprop="recipeInstructions"] [itemprop="itemListElement"]')
      .toArray()
      .map((element) => {
        const $step = this.$(element)
        const name = normalizeString($step.find('[itemprop="name"]').first().text()) || null
        const items = $step
          .find('[itemprop="description"] p')
          .toArray()
          .map((paragraph) => normalizeString(this.$(paragraph).text()))
          .filter((value) => value.length > 0)
          .map(createInstructionItem)

        return createInstructionGroup(name, items)
      })
      .filter((group) => group.items.length > 0)
  }
}
