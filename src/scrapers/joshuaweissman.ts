import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { ExtractionFailedException, NoIngredientsFoundException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { createIngredientGroup, createIngredientItem } from '@/utils/ingredients'
import { createInstructionGroup, createInstructionItem } from '@/utils/instructions'
import { parseYields } from '@/utils/parse-yields'
import { normalizeString } from '@/utils/parsing'

/** Bold Wix rich-text span used for each ingredient and method heading. */
const GROUP_HEADING = 'span[style="font-weight:700"]'

interface PostSection {
  name: string | null
  items: string[]
}

/**
 * Splits the post's lists into sections, each named by the bold heading
 * before it, keeping only the lists matched by `listSelector`.
 */
function postSections($: AbstractScraper['$'], listSelector: 'ul' | 'ol'): PostSection[] {
  const sections: PostSection[] = []
  let name: string | null = null

  for (const element of $(`${GROUP_HEADING}, ul > li, ol > li`).toArray()) {
    const $element = $(element)
    const text = normalizeString($element.text())

    if ($element.is(GROUP_HEADING)) {
      name = text.replace(/:$/, '') || null
      continue
    }

    if (!text || !$element.parent().is(listSelector)) {
      continue
    }

    const current = sections.at(-1)

    if (current && current.name === name) {
      current.items.push(text)
    } else {
      sections.push({ name, items: [text] })
    }
  }

  return sections
}

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
    instructions: this.instructions.bind(this),
    yields: this.yields.bind(this),
  } satisfies ScraperExtractors

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
    const groups = postSections(this.$, 'ul').map(({ name, items }) =>
      createIngredientGroup(name, items.map(createIngredientItem)),
    )

    if (groups.length === 0) {
      throw new NoIngredientsFoundException()
    }

    return groups
  }

  protected instructions(): RecipeFields['instructions'] {
    return postSections(this.$, 'ol').map(({ name, items }) =>
      createInstructionGroup(name, items.map(createInstructionItem)),
    )
  }

  /** Reads the "Serving Size: 4-6" line from the post body. */
  protected yields(prevValue: RecipeFields['yields'] | undefined): RecipeFields['yields'] {
    if (prevValue) return prevValue

    const servingSize = this.$('span')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .find((text) => /serving size/i.test(text))

    if (!servingSize) {
      throw new ExtractionFailedException('yields')
    }

    return parseYields(servingSize)
  }
}
