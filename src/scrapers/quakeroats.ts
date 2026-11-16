import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { ExtractionFailedException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { createIngredientGroup, createIngredientItem } from '@/utils/ingredients'
import { createInstructionGroup, createInstructionItem } from '@/utils/instructions'
import { parseYields } from '@/utils/parse-yields'
import { normalizeString, parseMinutes } from '@/utils/parsing'

const INGREDIENT_ITEM = 'div[id$="_lblIngredients"] > ul > li'
/** The desktop list; the mobile copy of the instructions is malformed markup. */
const INSTRUCTION_ITEM = '.RDCookingIns ul.cook-desc > li'
const MEASUREMENT = '.RDMeasurement .measurement-item'

interface Section {
  name: string | null
  items: string[]
}

/**
 * Scraper for quakeroats.com. The pages carry no Structured Data, so every
 * field is read from the page. Sub-recipe headings (a bold-only list item,
 * such as "Fluffy Steel Cut Oats") split the ingredients and instructions
 * into named groups.
 */
export class QuakerOats extends AbstractScraper {
  static host() {
    return 'quakeroats.com'
  }

  protected override readonly extractors = {
    author: this.author.bind(this),
    cookTime: this.cookTime.bind(this),
    description: this.description.bind(this),
    ingredients: this.ingredients.bind(this),
    instructions: this.instructions.bind(this),
    prepTime: this.prepTime.bind(this),
    title: this.title.bind(this),
    totalTime: this.totalTime.bind(this),
    yields: this.yields.bind(this),
  } satisfies ScraperExtractors

  /** Recipes are published by the company itself and name no author. */
  protected author(prevValue: RecipeFields['author'] | undefined): RecipeFields['author'] {
    return prevValue || 'The Quaker Oats Company'
  }

  protected title(): RecipeFields['title'] {
    const title = normalizeString(this.$('span[id$="_lblRecipeNameDesktop"]').first().text())

    if (!title) {
      throw new ExtractionFailedException('title')
    }

    return title
  }

  protected description(): RecipeFields['description'] {
    const description = normalizeString(this.$('meta[name="description"]').attr('content'))

    if (!description) {
      throw new ExtractionFailedException('description')
    }

    return description
  }

  protected ingredients(): RecipeFields['ingredients'] {
    const sections = this.sections(INGREDIENT_ITEM)

    if (sections.length === 0) {
      throw new ExtractionFailedException('ingredients')
    }

    return sections.map(({ name, items }) =>
      createIngredientGroup(name, items.map(createIngredientItem)),
    )
  }

  protected instructions(): RecipeFields['instructions'] {
    const sections = this.sections(INSTRUCTION_ITEM)

    if (sections.length === 0) {
      throw new ExtractionFailedException('instructions')
    }

    return sections.map(({ name, items }) =>
      createInstructionGroup(name, items.map(createInstructionItem)),
    )
  }

  protected yields(): RecipeFields['yields'] {
    const servings = normalizeString(this.$('span[id$="_lblServings"]').first().text())

    if (!servings) {
      throw new ExtractionFailedException('yields')
    }

    return parseYields(servings)
  }

  protected prepTime(prevValue: RecipeFields['prepTime'] | undefined): RecipeFields['prepTime'] {
    return this.measurementMinutes('Preparation Time') ?? prevValue ?? null
  }

  protected cookTime(prevValue: RecipeFields['cookTime'] | undefined): RecipeFields['cookTime'] {
    return this.measurementMinutes('Cook Time') ?? prevValue ?? null
  }

  protected totalTime(prevValue: RecipeFields['totalTime'] | undefined): RecipeFields['totalTime'] {
    const prepTime = this.measurementMinutes('Preparation Time')
    const cookTime = this.measurementMinutes('Cook Time')

    if (prepTime === null && cookTime === null) {
      return prevValue ?? null
    }

    return (prepTime ?? 0) + (cookTime ?? 0)
  }

  /** Reads the minutes shown above a measurement label such as "Cook Time". */
  private measurementMinutes(label: string): number | null {
    const item = this.$(MEASUREMENT)
      .toArray()
      .map((element) => this.$(element))
      .find((element) => normalizeString(element.children('p').text()) === label)
    const value = normalizeString(item?.children('span').first().text())

    if (!value) {
      return null
    }

    try {
      return parseMinutes(value) || null
    } catch {
      return null
    }
  }

  /** Splits list items into sections at each bold-only heading item. */
  private sections(selector: string): Section[] {
    const sections: Section[] = []
    let current: Section = { name: null, items: [] }

    for (const element of this.$(selector).toArray()) {
      const item = this.$(element)
      const text = normalizeString(item.text())

      if (!text) {
        continue
      }

      // A heading item holds nothing but bold text.
      if (normalizeString(item.find('strong').text()) === text) {
        if (current.items.length > 0) {
          sections.push(current)
        }
        current = { name: text.replace(/:$/, ''), items: [] }
      } else {
        current.items.push(text)
      }
    }

    if (current.items.length > 0) {
      sections.push(current)
    }

    return sections
  }
}
