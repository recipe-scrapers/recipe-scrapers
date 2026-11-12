import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { NoIngredientsFoundException } from '@/exceptions'
import type { IngredientGroup, RecipeFields } from '@/types/recipe.interface'
import { createIngredientGroup } from '@/utils/ingredients'
import { normalizeString } from '@/utils/parsing'

/**
 * Returns the group name when an ingredient line is really a sub-heading the
 * author typed as an ingredient (e.g. "For the Yogurt Ranch:"), else null.
 */
function pseudoHeadingName(value: string): string | null {
  const normalized = normalizeString(value)

  if (!normalized.endsWith(':')) {
    return null
  }

  return normalizeString(normalized.slice(0, -1)) || null
}

/**
 * Splits Ingredient Groups at ingredient lines that are sub-headings,
 * starting a new named group at each one.
 */
function splitPseudoHeadings(groups: IngredientGroup[]): IngredientGroup[] {
  const result: IngredientGroup[] = []

  for (const { name, items } of groups) {
    let current = createIngredientGroup(name)
    result.push(current)

    for (const item of items) {
      const headingName = pseudoHeadingName(item.value)

      if (headingName) {
        current = createIngredientGroup(headingName)
        result.push(current)
      } else {
        current.items.push(item)
      }
    }
  }

  return result.filter((group) => group.items.length > 0)
}

/**
 * Scraper for domesticate-me.com (WP Recipe Maker). The recipe's Structured
 * Data leaves the description empty and can omit the author, so both fall back
 * to the page's meta tags. Some recipes type sub-headings as ingredient lines,
 * which are promoted to Ingredient Group names.
 */
export class DomesticateMe extends AbstractScraper {
  static host() {
    return 'domesticate-me.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
    description: this.description.bind(this),
    ingredients: this.ingredients.bind(this),
  } satisfies ScraperExtractors

  protected author(prevValue: RecipeFields['author'] | undefined): RecipeFields['author'] {
    if (prevValue && normalizeString(prevValue)) {
      return prevValue
    }

    const author = this.metaContent('meta[name="author"]')

    if (!author) {
      throw new Error('Failed to extract author')
    }

    return author
  }

  protected description(
    prevValue: RecipeFields['description'] | undefined,
  ): RecipeFields['description'] {
    if (prevValue && normalizeString(prevValue)) {
      return prevValue
    }

    const description =
      this.metaContent('meta[name="description"]') ||
      this.metaContent('meta[property="og:description"]')

    if (!description) {
      throw new Error('Failed to extract description')
    }

    return description
  }

  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    const groups = splitPseudoHeadings(prevValue ?? [])

    if (groups.length === 0) {
      throw new NoIngredientsFoundException()
    }

    return groups
  }

  private metaContent(selector: string): string {
    return normalizeString(this.$(selector).first().attr('content'))
  }
}
