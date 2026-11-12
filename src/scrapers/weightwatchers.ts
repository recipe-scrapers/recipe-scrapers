import type { Cheerio } from 'cheerio'
import type { Element } from 'domhandler'

import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { stringsToIngredients } from '@/utils/ingredients'
import { normalizeString } from '@/utils/parsing'

const DEFAULT_SITE_NAME = 'WeightWatchers'

/**
 * Scraper for public WeightWatchers recipe pages.
 *
 * The Recipe JSON-LD covers most fields, but it has no author, it renders
 * ingredient notes in the middle of the ingredient line ("2 Stück, rot
 * Paprika"), and it leaves out the WeightWatchers Points value. Those fields
 * are read from the page instead.
 *
 * Some recipes publish an empty description. The page's meta description is
 * an SEO template ("Koche jetzt … in null …"), not a real description, so it
 * is deliberately not used; callers can supply `fallbackDescription`.
 */
export class WeightWatchers extends AbstractScraper {
  static host() {
    return 'weightwatchers.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
    ingredients: this.ingredients.bind(this),
    nutrients: this.nutrients.bind(this),
    siteName: this.siteName.bind(this),
  } satisfies ScraperExtractors

  /**
   * Recipes are published by WeightWatchers itself and carry no author.
   */
  protected author(prevValue: RecipeFields['author'] | undefined): RecipeFields['author'] {
    return prevValue || DEFAULT_SITE_NAME
  }

  /**
   * Uses the localized site name from the page title suffix
   * ("Kartoffelgulasch Rezept | WW Deutschland").
   */
  protected siteName(prevValue: RecipeFields['siteName'] | undefined): RecipeFields['siteName'] {
    const title = this.$('title').first().text()
    const separatorIndex = title.lastIndexOf('|')
    const siteName = separatorIndex === -1 ? '' : normalizeString(title.slice(separatorIndex + 1))

    return siteName || prevValue || DEFAULT_SITE_NAME
  }

  /**
   * Adds the recipe's Points value from the masthead coin to the
   * structured-data nutrients.
   */
  protected nutrients(prevValue: RecipeFields['nutrients'] | undefined): RecipeFields['nutrients'] {
    const nutrients: RecipeFields['nutrients'] = new Map(prevValue)
    const label = this.$('[data-e2e-name="primary_coin"] [aria-label]').first().attr('aria-label')
    const points = normalizeString(label?.replace(/&reg;|®/g, ''))

    if (points) {
      nutrients.set('points', points)
    }

    return nutrients
  }

  /**
   * Rebuilds each ingredient as "amount unit name; note" from the ingredient
   * card, falling back to the structured-data ingredients.
   */
  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    const values = this.$('[class*="IngredientsCard_card"] [data-e2e-name="ingredient_item"]')
      .toArray()
      .map((element) => this.ingredientText(this.$(element)))
      .filter((value) => value.length > 0)

    if (values.length > 0) {
      return stringsToIngredients(values)
    }

    if (prevValue && prevValue.length > 0) {
      return prevValue
    }

    throw new Error('Failed to extract ingredients')
  }

  /**
   * The description holds the amount in its first span, then the unit and an
   * optional note, either in one span ("Stück, rot") or split across two
   * (" g", ", vorwiegend festkochend").
   */
  private ingredientText(item: Cheerio<Element>): string {
    const name = normalizeString(item.find('[data-e2e-name="ingredient_name"]').first().text())
    const [amountPart, ...unitParts] = item
      .find('[data-e2e-name="ingredient_description"]')
      .first()
      .children('span')
      .toArray()
      .map((span) => this.$(span).text())

    const amount = normalizeString(amountPart)
    const unitAndNote = normalizeString(unitParts.join(''))
    const separatorIndex = unitAndNote.indexOf(',')
    const unit =
      separatorIndex === -1 ? unitAndNote : normalizeString(unitAndNote.slice(0, separatorIndex))
    const note = separatorIndex === -1 ? '' : normalizeString(unitAndNote.slice(separatorIndex + 1))

    const text = [amount, unit, name].filter((part) => part.length > 0).join(' ')

    return note ? `${text}; ${note}` : text
  }
}
