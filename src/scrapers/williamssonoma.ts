import { load } from 'cheerio/slim'

import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { ExtractionFailedException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { createInstructionGroup, createInstructionItem } from '@/utils/instructions'

/**
 * Decodes one level of HTML entities. Williams Sonoma escapes the markup in
 * its Structured Data text (`&lt;p&gt;`, `it&amp;rsquo;s`), so decoding once
 * turns it back into the HTML the shared HTML stripping then removes.
 */
function decodeEntities(value: string): string {
  return load(value, null, false).root().text()
}

/**
 * Scraper for williams-sonoma.com. The Structured Data names no author and
 * double-escapes the description and instructions, and the page groups its
 * ingredients under headings such as "For the frosting:".
 */
export class WilliamsSonoma extends AbstractScraper {
  static host() {
    return 'williams-sonoma.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
    description: this.description.bind(this),
    instructions: this.instructions.bind(this),
  } satisfies ScraperExtractors

  protected override readonly ingredientGroupStructure = {
    heading: '.botLeft > h3',
    item: '.botLeft > ul > li',
  }

  /** Recipes are published by Williams Sonoma; the Structured Data names no author. */
  protected author(prevValue: RecipeFields['author'] | undefined): RecipeFields['author'] {
    return prevValue || 'Williams Sonoma'
  }

  /** Unescapes the Structured Data description so its markup can be stripped. */
  protected description(
    prevValue: RecipeFields['description'] | undefined,
  ): RecipeFields['description'] {
    if (!prevValue) {
      throw new ExtractionFailedException('description')
    }

    return decodeEntities(prevValue)
  }

  /** Unescapes the Structured Data steps so their markup can be stripped. */
  protected instructions(
    prevValue: RecipeFields['instructions'] | undefined,
  ): RecipeFields['instructions'] {
    return (prevValue ?? []).map((group) =>
      createInstructionGroup(
        group.name,
        group.items.map((item) => createInstructionItem(decodeEntities(item.value))),
      ),
    )
  }
}
