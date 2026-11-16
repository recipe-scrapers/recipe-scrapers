import { load } from 'cheerio'

import { PostProcessorPlugin } from '@/abstract-postprocessor-plugin'
import type { RecipeFields } from '@/types/recipe.interface'
import { isString } from '@/utils'
import { isIngredients } from '@/utils/ingredients'
import { isInstructions } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

import type { Ingredients, Instructions } from '../types/recipe.interface'

const RESIDUAL_ENTITY_PATTERN = /&(?:[a-z][a-z\d]*|#\d+|#x[\da-f]+);/i

export class HtmlStripperPlugin extends PostProcessorPlugin {
  name = 'HtmlStripper'
  priority = 100 // Run early

  private fieldsToProcess: (keyof RecipeFields)[] = [
    'title',
    'description',
    'siteName',
    'instructions',
    'ingredients',
    'nutrients',
    'category',
    'cuisine',
    'keywords',
    'equipment',
    'dietaryRestrictions',
  ]

  shouldProcess(field: keyof RecipeFields): boolean {
    return this.fieldsToProcess.includes(field)
  }

  process<T>(field: keyof RecipeFields, value: T): T {
    if (!this.shouldProcess(field)) {
      return value
    }

    // The generic `process<T>` signature can't express "same type out"; each
    // branch is narrowed by a guard and returns a value of that same type,
    // with every field kept.
    if (isString(value)) {
      // oxlint-disable-next-line typescript/consistent-type-assertions -- string in, string out.
      return this.stripHtml(value) as T
    }

    if (field === 'instructions' && isInstructions(value)) {
      // oxlint-disable-next-line typescript/consistent-type-assertions -- Instructions in, Instructions out.
      return this.processInstructions(value) as T
    }

    if (field === 'ingredients' && isIngredients(value)) {
      // oxlint-disable-next-line typescript/consistent-type-assertions -- Ingredients in, Ingredients out.
      return this.processIngredients(value) as T
    }

    if (field === 'nutrients' && value instanceof Map) {
      // oxlint-disable-next-line typescript/consistent-type-assertions -- Map in, Map out.
      return this.processNutrients(value) as T
    }

    // List fields such as keywords carry entities from Structured Data
    // ("Pasta &amp; Noodles").
    if (value instanceof Set) {
      // oxlint-disable-next-line typescript/consistent-type-assertions -- Set in, Set out.
      return this.processList(value) as T
    }

    return value
  }

  private processList(list: Set<unknown>): Set<unknown> {
    return new Set([...list].map((item) => (isString(item) ? this.stripHtml(item) : item)))
  }

  // Some sites embed markup in Structured Data nutrient values, such as
  // `<b>Diabetic Exchanges</b>: </b> 3 lean meat` on tasteofhome.com, so
  // whitespace left around removed tags is collapsed too. Non-string values
  // are kept.
  private processNutrients(nutrients: Map<unknown, unknown>): Map<unknown, unknown> {
    return new Map(
      [...nutrients].map(([key, value]) => [
        key,
        isString(value) ? normalizeString(this.stripHtml(value)) : value,
      ]),
    )
  }

  // Groups and items are spread so fields other than the text (such as an
  // ingredient's `parsed` data) survive stripping.
  private processIngredients(ingredients: Ingredients): Ingredients {
    return ingredients.map((group) => ({
      ...group,
      name: group.name === null ? null : this.stripHtml(group.name),
      items: group.items.map((item) => ({ ...item, value: this.stripHtml(item.value) })),
    }))
  }

  private processInstructions(instructions: Instructions): Instructions {
    return instructions.map((group) => ({
      ...group,
      name: group.name === null ? null : this.stripHtml(group.name),
      items: group.items.map((item) => ({ ...item, value: this.stripHtml(item.value) })),
    }))
  }

  private stripHtml(html: string): string {
    const text = this.toText(html)

    // Some sites double-encode entities (e.g. `&amp;atilde;`), which leaves
    // entity text behind after one pass. Decode once more in that case,
    // escaping `<` so decoded text is never re-parsed as markup.
    const decoded = RESIDUAL_ENTITY_PATTERN.test(text)
      ? this.toText(text.replaceAll('<', '&lt;'))
      : text

    // Cheerio decodes &nbsp; as non-breaking space (U+00A0), normalized to a
    // regular space. Removed block tags leave runs of whitespace behind
    // ("breasts. </p>\n<p>Toss"), so those collapse to one space.
    return decoded.replace(/\s+/g, ' ').trim()
  }

  private toText(html: string): string {
    return load(html, null, false).root().text()
  }
}
