import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { ExtractionFailedException, NoIngredientsFoundException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { textGroups, texts } from '@/utils/dom'
import { createIngredientGroup, createIngredientItem } from '@/utils/ingredients'
import { parseYields } from '@/utils/parse-yields'
import { normalizeString } from '@/utils/parsing'

/** Bold Wix rich-text span used for each ingredient and method heading. */
const GROUP_HEADING = 'span[style="font-weight:700"]'

/**
 * Joshua Weissman's Wix blog posts carry a Recipe JSON-LD with only a title,
 * author, and a truncated description, so the recipe is read from the post
 * body: bold headings name the ingredient lists and method lists below them.
 */
export class JoshuaWeissman extends AbstractScraper {
  static host() {
    return 'joshuaweissman.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
    description: this.description.bind(this),
    ingredients: this.ingredients.bind(this),
    yields: this.yields.bind(this),
  } satisfies ScraperExtractors

  /** Each method list's steps, named by the bold heading above it. */
  protected override readonly instructionStructure = {
    heading: GROUP_HEADING,
    item: 'ol > li',
  }

  /**
   * Every recipe is Joshua Weissman's. The JSON-LD author is the Wix account
   * that posted it (such as "paytonmin"), while its publisher names him.
   */
  protected author(): RecipeFields['author'] {
    return 'Joshua Weissman'
  }

  /** Uses the post's intro paragraph; the JSON-LD description runs into the ingredients. */
  protected description(
    prevValue: RecipeFields['description'] | undefined,
  ): RecipeFields['description'] {
    const description = normalizeString(this.$('#viewer-foo').text())

    if (description) return description
    if (prevValue) return prevValue

    throw new ExtractionFailedException('description')
  }

  protected ingredients(): RecipeFields['ingredients'] {
    const groups = textGroups(this.$, { heading: GROUP_HEADING, item: 'ul > li' }).map(
      ({ name, items }) => createIngredientGroup(name, items.map(createIngredientItem)),
    )

    if (groups.length === 0) {
      throw new NoIngredientsFoundException()
    }

    return groups
  }

  /** Reads the "Serving Size: 4-6" line from the post body. */
  protected yields(prevValue: RecipeFields['yields'] | undefined): RecipeFields['yields'] {
    if (prevValue) return prevValue

    const servingSize = texts(this.$, 'span').find((text) => /serving size/i.test(text))

    if (!servingSize) {
      throw new ExtractionFailedException('yields')
    }

    return parseYields(servingSize)
  }
}
