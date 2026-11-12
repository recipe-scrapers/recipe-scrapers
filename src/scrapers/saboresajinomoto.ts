import type { Element } from 'domhandler'

import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { NoIngredientsFoundException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { flattenIngredients, groupIngredients } from '@/utils/ingredients'
import { stringsToInstructions } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

const INGREDIENT_HEADING_SELECTOR = '.ingredients p'
const INGREDIENT_ITEM_SELECTOR = '.ingredients li'

/**
 * Matches UTF-8 text that was decoded as Latin-1 (for example `purÃª` for
 * `purê`), which the site's Structured Data description sometimes contains.
 */
const MOJIBAKE_PATTERN = /[\u00c2\u00c3][\u0080-\u00bf]/

/**
 * Scraper for saboresajinomoto.com.br. The Structured Data omits ingredients
 * and instructions, publishes an upper-case name, and its description is
 * either empty or mis-encoded, so those fields come from the Recipe Page.
 */
export class SaboresAjinomoto extends AbstractScraper {
  static host() {
    return 'saboresajinomoto.com.br'
  }

  protected override readonly extractors = {
    category: this.category.bind(this),
    description: this.description.bind(this),
    ingredients: this.ingredients.bind(this),
    instructions: this.instructions.bind(this),
    siteName: this.siteName.bind(this),
    title: this.title.bind(this),
  } satisfies ScraperExtractors

  protected siteName(): RecipeFields['siteName'] {
    return 'Sabores Ajinomoto'
  }

  /**
   * Converts the upper-case Structured Data name to sentence case.
   */
  protected title(prevValue: RecipeFields['title'] | undefined): RecipeFields['title'] {
    const value =
      normalizeString(prevValue) || normalizeString(this.$('h1[itemprop="name"]').text())

    if (!value) {
      throw new Error('Failed to extract title')
    }

    const lower = value.toLocaleLowerCase('pt-BR')

    return `${lower.charAt(0).toLocaleUpperCase('pt-BR')}${lower.slice(1)}`
  }

  /**
   * Reads the recipe category from the second breadcrumb item.
   */
  protected category(prevValue: RecipeFields['category'] | undefined): RecipeFields['category'] {
    if (prevValue && prevValue.size > 0) {
      return prevValue
    }

    const value = normalizeString(this.$('ul.bread_crumb li').eq(1).text())

    return value ? new Set([value]) : (prevValue ?? new Set())
  }

  /**
   * Uses the Structured Data description unless it is empty or mis-encoded,
   * then falls back to the page's meta description.
   */
  protected description(
    prevValue: RecipeFields['description'] | undefined,
  ): RecipeFields['description'] {
    const value = normalizeString(prevValue)

    if (value && !MOJIBAKE_PATTERN.test(value)) {
      return value
    }

    const description =
      normalizeString(this.$('meta[name="description"]').first().attr('content')) ||
      normalizeString(this.$('meta[property="og:description"]').first().attr('content'))

    if (!description) {
      throw new Error('Failed to extract description')
    }

    return description
  }

  /**
   * Groups ingredients under the bold paragraph headings in the ingredient list.
   */
  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    const structuredValues = flattenIngredients(prevValue ?? [])
    const values =
      structuredValues.length > 0
        ? structuredValues
        : this.$(INGREDIENT_ITEM_SELECTOR)
            .toArray()
            .map((element) => this.elementText(element))
            .filter((value) => value.length > 0)

    if (values.length === 0) {
      throw new NoIngredientsFoundException()
    }

    return groupIngredients(this.$, values, INGREDIENT_HEADING_SELECTOR, INGREDIENT_ITEM_SELECTOR)
  }

  protected instructions(
    prevValue: RecipeFields['instructions'] | undefined,
  ): RecipeFields['instructions'] {
    if (prevValue && prevValue.length > 0) {
      return prevValue
    }

    const values = this.$('.steps li')
      .toArray()
      .map((element) => this.elementText(element))
      .filter((value) => value.length > 0)

    if (values.length === 0) {
      throw new Error('Failed to extract instructions')
    }

    return stringsToInstructions(values)
  }

  private elementText(element: Element): string {
    return normalizeString(this.$(element).text())
  }
}
