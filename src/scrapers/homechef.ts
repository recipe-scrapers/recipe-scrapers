import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { ExtractionFailedException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { normalizeString } from '@/utils/parsing'

/** One numbered step in the microdata `ItemList` of instructions. */
const STEP = '[itemprop="recipeInstructions"] [itemprop="itemListElement"]'

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
  } satisfies ScraperExtractors

  /** Each numbered step becomes an Instruction Group of its paragraphs. */
  protected override readonly instructionStructure = {
    heading: `${STEP} [itemprop="name"]`,
    item: `${STEP} [itemprop="description"] p`,
  }

  /** Reads the chef's name, skipping the "Chef" label heading above it. */
  protected author(prevValue: RecipeFields['author'] | undefined): RecipeFields['author'] {
    const author = normalizeString(
      this.$('[itemprop="author"] [itemprop="name"] h4').first().text(),
    )

    if (author) return author
    if (prevValue) return prevValue

    throw new ExtractionFailedException('author')
  }
}
