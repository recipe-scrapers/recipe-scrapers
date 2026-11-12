import { load } from 'cheerio'

import { PostProcessorPlugin } from '@/abstract-postprocessor-plugin'
import type { RecipeFields } from '@/types/recipe.interface'
import { isString } from '@/utils'
import { isIngredients } from '@/utils/ingredients'
import { isInstructions } from '@/utils/instructions'

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
  ]

  shouldProcess<Key extends keyof RecipeFields>(field: Key): boolean {
    return this.fieldsToProcess.includes(field)
  }

  process<T>(field: keyof RecipeFields, value: T): T {
    if (!this.shouldProcess(field)) {
      return value
    }

    if (isString(value)) {
      return this.stripHtml(value) as T
    }

    if (field === 'instructions' && isInstructions(value)) {
      return this.processInstructions(value) as T
    }

    if (field === 'ingredients' && isIngredients(value)) {
      return this.processIngredients(value) as T
    }

    return value
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

    // Cheerio decodes &nbsp; as non-breaking space (U+00A0),
    // normalize to regular space
    return decoded.replace(/\u00A0/g, ' ').trim()
  }

  private toText(html: string): string {
    return load(html, null, false).root().text()
  }
}
