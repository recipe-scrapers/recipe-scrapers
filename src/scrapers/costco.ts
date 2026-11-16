import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { ExtractionFailedException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { groupIngredients } from '@/utils/ingredients'
import { stringsToInstructions } from '@/utils/instructions'
import { parseYields } from '@/utils/parse-yields'
import { normalizeString } from '@/utils/parsing'

/** The recipe column: headline, ingredient list, then method paragraphs. */
const RECIPE = 'div.col-md-5:has(> h1)'
const INGREDIENT_HEADING = `${RECIPE} > p > strong`
const INGREDIENT_ITEM = `${RECIPE} > ul > li`

/** The serving count that ends the method, as in "Makes 6 servings." */
const MAKES_PATTERN = /\bMakes\s+(\d[^.]*)/i

/**
 * Scraper for Costco Connection recipe pages on costco.com. The pages carry
 * no Structured Data, so every field is read from the recipe column. There is
 * no recipe description either: the meta description is a store template
 * ("Find a great collection of Recipe - …"), so it is deliberately not used
 * and callers can supply `fallbackDescription`.
 */
export class Costco extends AbstractScraper {
  static host() {
    return 'costco.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
    image: this.image.bind(this),
    ingredients: this.ingredients.bind(this),
    instructions: this.instructions.bind(this),
    siteName: this.siteName.bind(this),
    title: this.title.bind(this),
    yields: this.yields.bind(this),
  } satisfies ScraperExtractors

  /** Recipes come from the Costco Connection magazine and name no author. */
  protected author(prevValue: RecipeFields['author'] | undefined): RecipeFields['author'] {
    return prevValue || 'Costco Connection'
  }

  protected siteName(prevValue: RecipeFields['siteName'] | undefined): RecipeFields['siteName'] {
    return prevValue || 'Costco'
  }

  protected title(): RecipeFields['title'] {
    const title = normalizeString(this.$(RECIPE).children('h1').first().text())

    if (title) {
      return title
    }

    throw new ExtractionFailedException('title')
  }

  /** Reads the recipe photo beside the recipe column. */
  protected image(): RecipeFields['image'] {
    const image = this.$(RECIPE).siblings('div.col-md-6').find('img').first().attr('src')

    if (image?.startsWith('http')) {
      return image
    }

    throw new ExtractionFailedException('image')
  }

  /** Reads the ingredient list, grouped under any bold heading above it. */
  protected ingredients(): RecipeFields['ingredients'] {
    const values = this.texts(INGREDIENT_ITEM)

    if (values.length > 0) {
      return groupIngredients(this.$, values, INGREDIENT_HEADING, INGREDIENT_ITEM)
    }

    throw new ExtractionFailedException('ingredients')
  }

  /** Reads the method paragraphs, skipping bold-only ingredient headings. */
  protected instructions(): RecipeFields['instructions'] {
    const steps = this.methodParagraphs()

    if (steps.length > 0) {
      return stringsToInstructions(steps)
    }

    throw new ExtractionFailedException('instructions')
  }

  /** Reads the serving count stated in the method ("Makes 6 servings."). */
  protected yields(): RecipeFields['yields'] {
    for (const step of this.methodParagraphs()) {
      const makes = MAKES_PATTERN.exec(step)?.[1]

      if (makes) {
        return parseYields(makes)
      }
    }

    throw new ExtractionFailedException('yields')
  }

  private methodParagraphs(): string[] {
    return this.$(RECIPE)
      .children('p')
      .toArray()
      .filter((element) => {
        const paragraph = this.$(element)
        const text = normalizeString(paragraph.text())
        return text.length > 0 && text !== normalizeString(paragraph.children('strong').text())
      })
      .map((element) => normalizeString(this.$(element).text()))
  }

  private texts(selector: string): string[] {
    return this.$(selector)
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter(Boolean)
  }
}
