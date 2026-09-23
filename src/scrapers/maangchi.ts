import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { createIngredientGroup, createIngredientItem } from '@/utils/ingredients'
import { createInstructionGroup, createInstructionItem } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

export class Maangchi extends AbstractScraper {
  static host() {
    return 'maangchi.com'
  }

  protected override readonly extractors = {
    ingredients: this.ingredients.bind(this),
    instructions: this.instructions.bind(this),
    ratings: this.ratings.bind(this),
    ratingsCount: this.ratingsCount.bind(this),
    yields: this.yields.bind(this),
  } satisfies ScraperExtractors

  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    const groups = this.recipeSectionGroups('Ingredients', 'Directions').map(({ name, items }) =>
      createIngredientGroup(name, items.map(createIngredientItem)),
    )

    return groups.length > 0 ? groups : (prevValue ?? [])
  }

  protected instructions(
    prevValue: RecipeFields['instructions'] | undefined,
  ): RecipeFields['instructions'] {
    const groups = this.recipeSectionGroups('Directions').map(({ name, items }) =>
      createInstructionGroup(name, items.map(createInstructionItem)),
    )

    return groups.length > 0 ? groups : (prevValue ?? [])
  }

  protected ratings(prevValue: RecipeFields['ratings'] | undefined): RecipeFields['ratings'] {
    const value = Number.parseFloat(this.$('.js-rmp-avg-rating').first().text())
    return Number.isNaN(value) ? (prevValue ?? 0) : value
  }

  protected ratingsCount(
    prevValue: RecipeFields['ratingsCount'] | undefined,
  ): RecipeFields['ratingsCount'] {
    const value = Number.parseInt(this.$('.js-rmp-vote-count').first().text(), 10)
    return Number.isNaN(value) ? (prevValue ?? 0) : value
  }

  protected yields(prevValue: RecipeFields['yields'] | undefined): RecipeFields['yields'] {
    const text = normalizeString(this.recipeHeading('Ingredients').next('p').text())
    const values = Array.from(text.matchAll(/\d+(?:\.\d+)?/g))
    const amount = values.at(-1)?.[0]

    return amount ? `${amount} serving${amount === '1' ? '' : 's'}` : (prevValue ?? '')
  }

  private recipeHeading(label: string) {
    return this.$('.entry h2')
      .filter((_, element) => normalizeString(this.$(element).text()) === label)
      .first()
  }

  private recipeSectionGroups(
    startLabel: string,
    endLabel?: string,
  ): Array<{ name: string | null; items: string[] }> {
    const start = this.recipeHeading(startLabel)
    const end = endLabel ? this.recipeHeading(endLabel) : this.$('.entry .print-recipe').first()

    if (start.length === 0 || end.length === 0) return []

    const groups: Array<{ name: string | null; items: string[] }> = []
    let name: string | null = null
    let items: string[] = []

    for (const element of start.nextUntil(end).filter('h3, ul, ol').toArray()) {
      if (this.$(element).is('h3')) {
        if (items.length > 0) groups.push({ name, items })
        name = normalizeString(this.$(element).text()).replace(/:$/, '') || null
        items = []
        continue
      }

      items.push(
        ...this.$(element)
          .find('li')
          .toArray()
          .map((item) => normalizeString(this.$(item).text()))
          .filter((value) => value.length > 0),
      )
    }

    if (items.length > 0) groups.push({ name, items })
    return groups
  }
}
