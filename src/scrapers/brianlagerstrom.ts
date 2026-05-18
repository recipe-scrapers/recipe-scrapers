import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { NoIngredientsFoundException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import {
  createIngredientGroup,
  createIngredientItem,
} from '@/utils/ingredients'
import {
  createInstructionGroup,
  createInstructionItem,
  splitNumberedInstructions,
} from '@/utils/instructions'
import { normalizeString, stripLeadingBullet } from '@/utils/parsing'

function extractMetaContent($: AbstractScraper['$'], selector: string): string {
  return normalizeString($(selector).attr('content'))
}

function stripSiteSuffix(value: string): string {
  return normalizeString(value.replace(/\s+[\u2014-]\s+Brian Lagerstrom$/, ''))
}

export class BrianLagerstrom extends AbstractScraper {
  static host() {
    return 'brianlagerstrom.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
    description: this.description.bind(this),
    ingredients: this.ingredients.bind(this),
    instructions: this.instructions.bind(this),
    title: this.title.bind(this),
    yields: this.yields.bind(this),
  } satisfies ScraperExtractors

  protected title(
    prevValue: RecipeFields['title'] | undefined,
  ): RecipeFields['title'] {
    const heading = normalizeString(
      this.$('.entry-title[itemprop="headline"]').text(),
    )
    if (heading) return heading

    const metaTitle = extractMetaContent(this.$, 'meta[property="og:title"]')
    if (metaTitle) return stripSiteSuffix(metaTitle)

    if (prevValue) return stripSiteSuffix(prevValue)

    throw new Error('Failed to extract title')
  }

  protected author(
    prevValue: RecipeFields['author'] | undefined,
  ): RecipeFields['author'] {
    if (prevValue) return prevValue

    const siteName = extractMetaContent(this.$, 'meta[property="og:site_name"]')
    if (siteName) return siteName

    return 'Brian Lagerstrom'
  }

  protected description(
    prevValue: RecipeFields['description'] | undefined,
  ): RecipeFields['description'] {
    const contentBlocks = this.recipeContentBlocks()
    const ingredientBlockIndex = this.ingredientBlockIndex()
    const introBlocks =
      ingredientBlockIndex >= 0
        ? contentBlocks.slice(0, ingredientBlockIndex)
        : contentBlocks
    const introParagraph = this.$(introBlocks)
      .find('p')
      .toArray()
      .map((element) => normalizeString(this.$(element).text()))
      .find(
        (value) =>
          value &&
          !/^as an amazon/i.test(value) &&
          !/^ingredients:?$/i.test(value) &&
          !/^instructions:?$/i.test(value) &&
          stripLeadingBullet(value) === value,
      )

    if (introParagraph) return introParagraph

    const metaDescription =
      extractMetaContent(this.$, 'meta[itemprop="description"]') ||
      extractMetaContent(this.$, 'meta[property="og:description"]')
    if (metaDescription) return metaDescription

    if (prevValue) return prevValue

    throw new Error('Failed to extract description')
  }

  private recipeContentBlocks() {
    return this.$('.blog-item-content .sqs-html-content').toArray()
  }

  private ingredientBlockIndex(): number {
    return this.recipeContentBlocks().findIndex((element) => {
      const text = normalizeString(this.$(element).text())
      return /ingredients:?/i.test(text)
    })
  }

  protected ingredients(): RecipeFields['ingredients'] {
    const contentBlocks = this.recipeContentBlocks()
    const ingredientBlockIndex = this.ingredientBlockIndex()

    if (ingredientBlockIndex < 0) {
      throw new NoIngredientsFoundException()
    }

    const items: ReturnType<typeof createIngredientItem>[] = []

    for (const element of contentBlocks.slice(ingredientBlockIndex)) {
      const listItems = this.$(element).find('li').toArray()

      if (listItems.length > 0) {
        items.push(
          ...listItems
            .map((item) => stripLeadingBullet(this.$(item).text()))
            .filter((value) => value.length > 0)
            .map(createIngredientItem),
        )
        break
      }

      const paragraphs = this.$(element).find('p').toArray()

      for (const paragraph of paragraphs) {
        const text = normalizeString(this.$(paragraph).text())

        if (/^instructions:?$/i.test(text)) {
          return [createIngredientGroup(null, items)]
        }

        if (
          !text ||
          /^as an amazon/i.test(text) ||
          /^ingredients:?$/i.test(text)
        ) {
          continue
        }

        const ingredient = stripLeadingBullet(text)

        if (ingredient !== text) {
          items.push(createIngredientItem(ingredient))
        }
      }
    }

    if (items.length === 0) {
      throw new NoIngredientsFoundException()
    }

    return [createIngredientGroup(null, items)]
  }

  protected instructions(): RecipeFields['instructions'] {
    const contentBlocks = this.recipeContentBlocks()
    const ingredientBlockIndex = this.ingredientBlockIndex()

    if (ingredientBlockIndex < 0) {
      return []
    }

    for (const element of contentBlocks.slice(ingredientBlockIndex + 1)) {
      const orderedListItems = this.$(element).find('ol li').toArray()

      if (orderedListItems.length > 1) {
        return [
          createInstructionGroup(
            null,
            orderedListItems
              .map((item) => normalizeString(this.$(item).text()))
              .filter((value) => value.length > 0)
              .map(createInstructionItem),
          ),
        ]
      }
    }

    const steps: string[] = []

    for (const element of contentBlocks.slice(ingredientBlockIndex + 1)) {
      const text = normalizeString(this.$(element).text())

      if (!text || /^faq/i.test(text) || /amazon affiliate/i.test(text)) {
        break
      }

      steps.push(...splitNumberedInstructions(text))
    }

    return [
      createInstructionGroup(
        null,
        steps.filter((value) => value.length > 0).map(createInstructionItem),
      ),
    ]
  }

  protected yields(
    prevValue: RecipeFields['yields'] | undefined,
  ): RecipeFields['yields'] {
    if (prevValue) return prevValue

    const bodyText = normalizeString(this.$('.blog-item-content').text())
    const match = bodyText.match(
      /\b(?:serves?|yield(?:s)?)\s*:?\s*([0-9][^|.,;]*)/i,
    )
    const servings = normalizeString(match?.[1])

    if (servings) {
      return servings
    }

    return '1 recipe'
  }
}
