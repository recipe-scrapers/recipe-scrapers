import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { ExtractionFailedException, NoIngredientsFoundException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { groupIngredients } from '@/utils/ingredients'
import { stringsToInstructions } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

/** Narrow left-hand column that holds the ingredient lists. */
const INGREDIENT_COLUMN = 'div.sqs-col-4.span-4'
/** Wide right-hand column that holds the numbered steps. */
const INSTRUCTION_COLUMN = 'div.sqs-col-8.span-8'

/**
 * Tasting History is a Squarespace blog without Recipe Structured Data, so
 * every recipe field is read from the post markup.
 */
export class TastingHistory extends AbstractScraper {
  static host() {
    return 'tastinghistory.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
    category: this.category.bind(this),
    description: this.description.bind(this),
    image: this.image.bind(this),
    ingredients: this.ingredients.bind(this),
    instructions: this.instructions.bind(this),
    title: this.title.bind(this),
  } satisfies ScraperExtractors

  protected title(prevValue: RecipeFields['title'] | undefined): RecipeFields['title'] {
    const heading = normalizeString(this.$('h1').first().text())

    if (heading) return heading
    if (prevValue) return prevValue

    throw new ExtractionFailedException('title')
  }

  protected author(prevValue: RecipeFields['author'] | undefined): RecipeFields['author'] {
    const author =
      normalizeString(this.$('meta[itemprop="author"]').attr('content')) ||
      normalizeString(this.$('.blog-author-name').first().text())

    if (author) return author
    if (prevValue) return prevValue

    throw new ExtractionFailedException('author')
  }

  protected category(prevValue: RecipeFields['category'] | undefined): RecipeFields['category'] {
    const tags = this.$('a.blog-item-tag')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter((tag) => tag.length > 0)

    return tags.length > 0 ? new Set(tags) : (prevValue ?? new Set())
  }

  protected description(
    prevValue: RecipeFields['description'] | undefined,
  ): RecipeFields['description'] {
    const description =
      normalizeString(this.$('meta[property="og:description"]').attr('content')) ||
      normalizeString(this.$('meta[name="description"]').attr('content'))

    if (description) return description
    if (prevValue) return prevValue

    throw new ExtractionFailedException('description')
  }

  /** Uses the full-size hero photo rather than the resized share image. */
  protected image(prevValue: RecipeFields['image'] | undefined): RecipeFields['image'] {
    const image = normalizeString(this.$('img[data-image]').first().attr('data-image'))

    if (image) return image
    if (prevValue) return prevValue

    throw new ExtractionFailedException('image')
  }

  protected ingredients(): RecipeFields['ingredients'] {
    const itemSelector = `${INGREDIENT_COLUMN} .sqs-block-content ul li`
    const values = this.$(itemSelector)
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter((value) => value.length > 0)

    if (values.length === 0) {
      throw new NoIngredientsFoundException()
    }

    return groupIngredients(
      this.$,
      values,
      `${INGREDIENT_COLUMN} .sqs-block-markdown .sqs-block-content p`,
      itemSelector,
    )
  }

  protected instructions(): RecipeFields['instructions'] {
    const steps = this.$(`${INSTRUCTION_COLUMN} .sqs-block-content ol`)
      .first()
      .find('li')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .filter((step) => step.length > 0)

    if (steps.length === 0) {
      throw new ExtractionFailedException('instructions')
    }

    return stringsToInstructions(steps)
  }
}
