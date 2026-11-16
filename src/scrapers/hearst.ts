import type { CheerioAPI } from 'cheerio'

import { ExtractionFailedException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import type { IngredientGroupStructure } from '@/utils/ingredients'
import { stringsToInstructions } from '@/utils/instructions'
import { normalizeString } from '@/utils/parsing'

/**
 * Ingredient Group markup shared by Hearst Hosts (Delish, Good Housekeeping,
 * The Pioneer Woman): each group is an `h3` heading followed by a list.
 */
export const HEARST_INGREDIENT_GROUPS: IngredientGroupStructure = {
  heading: '.ingredients-body h3',
  item: '.ingredient-lists li',
}

/**
 * Drops the `label: value` CMS metadata Hearst mixes into Structured Data
 * keywords, such as "locale: US" or "TOTALTIME: 00:10:00".
 */
export function hearstKeywords(
  prevValue: RecipeFields['keywords'] | undefined,
): RecipeFields['keywords'] {
  return new Set([...(prevValue ?? [])].filter((keyword) => !keyword.includes(': ')))
}

/**
 * Marks a step boundary in a directions list item: the information separator
 * control character, which page text never contains.
 */
const STEP_SEPARATOR = '\u001f'

/** A leading step label such as "Step 2" or "2." that the page prints before a step. */
const STEP_LABEL = /^(?:step\s*\d+[.):]?|\d+[.)])\s*/i

/**
 * Returns the Structured Data instructions, or the steps in the Recipe
 * Page's `.directions` list when Hearst publishes an empty
 * `recipeInstructions`. A list item may hold several steps as paragraphs or
 * as `<br>`-separated lines.
 *
 * @throws {ExtractionFailedException} When neither source has any steps
 */
export function hearstInstructions(
  $: CheerioAPI,
  prevValue: RecipeFields['instructions'] | undefined,
): RecipeFields['instructions'] {
  if (prevValue?.some((group) => group.items.length > 0)) {
    return prevValue
  }

  const steps = $('.directions li')
    .not(':has(li)')
    .toArray()
    .flatMap((item) => {
      const $item = $(item).clone()
      $item.find('style').remove()
      // Only `<br>` and paragraph ends separate steps. Newlines in the source
      // are just wrapping, so they become spaces in `normalizeString` below.
      $item.find('br').replaceWith(STEP_SEPARATOR)
      $item.find('p').after(STEP_SEPARATOR)
      return $item.text().split(STEP_SEPARATOR)
    })
    .map((line) => normalizeString(line).replace(STEP_LABEL, ''))
    .filter(Boolean)

  if (steps.length === 0) {
    throw new ExtractionFailedException('instructions')
  }

  return stringsToInstructions(steps)
}
