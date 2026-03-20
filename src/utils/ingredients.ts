import type { CheerioAPI } from 'cheerio'
import type {
  IngredientGroup,
  IngredientItem,
  Ingredients,
} from '@/types/recipe.interface'
import { isPlainObject, isString } from './index'
import { normalizeString } from './parsing'

const DEFAULT_GROUPING_SELECTORS = {
  wprm: {
    headingSelectors: [
      '.wprm-recipe-ingredient-group h4',
      '.wprm-recipe-group-name',
    ],
    itemSelectors: ['.wprm-recipe-ingredient', '.wprm-recipe-ingredients li'],
  },
  tasty: {
    headingSelectors: [
      '.tasty-recipes-ingredients-body p strong',
      '.tasty-recipes-ingredients h4',
    ],
    itemSelectors: [
      '.tasty-recipes-ingredients-body ul li',
      '.tasty-recipes-ingredients ul li',
    ],
  },
} as const satisfies Record<
  string,
  { headingSelectors: string[]; itemSelectors: string[] }
>

/**
 * Creates an IngredientItem.
 */
export function createIngredientItem(value: string): IngredientItem {
  return { value }
}

/**
 * Creates an IngredientGroup.
 */
export function createIngredientGroup(
  name: string | null,
  items: IngredientItem[] = [],
): IngredientGroup {
  return { name, items }
}

/**
 * Type guard to check if value is an IngredientItem.
 */
export function isIngredientItem(value: unknown): value is IngredientItem {
  return isPlainObject(value) && 'value' in value && isString(value.value)
}

/**
 * Type guard to check if value is an IngredientGroup.
 */
export function isIngredientGroup(value: unknown): value is IngredientGroup {
  return (
    isPlainObject(value) &&
    'name' in value &&
    'items' in value &&
    Array.isArray(value.items) &&
    value.items.every(isIngredientItem)
  )
}

/**
 * Type guard to check if value is an Ingredients array.
 */
export function isIngredients(value: unknown): value is Ingredients {
  return Array.isArray(value) && value.every(isIngredientGroup)
}

/**
 * Extracts the flat list of ingredient values from an Ingredients array.
 * Useful when scrapers need to re-group ingredients using HTML structure.
 */
export function flattenIngredients(ingredients: Ingredients): string[] {
  return ingredients.flatMap((group) => group.items.map((item) => item.value))
}

/**
 * Converts an array of strings to an Ingredients array with a single
 * default group.
 */
export function stringsToIngredients(
  values: string[],
  groupName: string | null = null,
): Ingredients {
  const items = values.map(createIngredientItem)
  return [createIngredientGroup(groupName, items)]
}

export function scoreSentenceSimilarity(first: string, second: string): number {
  if (first === second) {
    return 1
  }

  if (first.length < 2 || second.length < 2) {
    return 0
  }

  const bigrams = (s: string) =>
    new Set(Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2)))

  const firstBigrams = bigrams(first)
  const secondBigrams = bigrams(second)

  const intersectionSize = [...firstBigrams].filter((b) =>
    secondBigrams.has(b),
  ).length

  return (2 * intersectionSize) / (firstBigrams.size + secondBigrams.size)
}

export function bestMatch(testString: string, targetStrings: string[]): string {
  if (targetStrings.length === 0) {
    throw new Error('targetStrings cannot be empty')
  }

  const scores = targetStrings.map((t) =>
    scoreSentenceSimilarity(testString, t),
  )

  let bestIndex = 0
  let bestScore = scores[0]

  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i]
      bestIndex = i
    }
  }

  return targetStrings[bestIndex]
}

function findSelectors(
  $: CheerioAPI,
  initialHeading?: string,
  initialItem?: string,
): [string, string] | null {
  if (initialHeading && initialItem) {
    // Check if the provided selectors actually exist in the DOM
    if ($(initialHeading).length && $(initialItem).length) {
      return [initialHeading, initialItem]
    }
    // If custom selectors are provided but not found, return null
    return null
  }

  const values = Object.values(DEFAULT_GROUPING_SELECTORS)

  for (const { headingSelectors, itemSelectors } of values) {
    for (const heading of headingSelectors) {
      for (const item of itemSelectors) {
        if ($(heading).length && $(item).length) {
          return [heading, item]
        }
      }
    }
  }

  return null
}

/**
 * Groups ingredients based on the provided selectors.
 * If no selectors are provided, it will try to find the best matching
 * selectors from the default grouping selectors.
 *
 * @param $ Cheerio instance
 * @param ingredientValues Array of ingredient strings to group
 * @param headingSelector Optional custom heading selector
 * @param itemSelector Optional custom item selector
 * @returns Ingredients array with groups
 */
export function groupIngredients(
  $: CheerioAPI,
  ingredientValues: string[],
  headingSelector?: string,
  itemSelector?: string,
): Ingredients {
  const selectors = findSelectors($, headingSelector, itemSelector)

  if (!selectors) {
    return stringsToIngredients(ingredientValues)
  }

  const [groupNameSelector, ingredientSelector] = selectors

  const foundIngredients = $(ingredientSelector)
    .toArray()
    .map((el) => normalizeString($(el).text()))
    .filter((text) => text.length > 0)

  const uniqueFoundIngredients = new Set(foundIngredients)
  const uniqueIngredientValues = new Set(
    ingredientValues.map((value) => normalizeString(value)),
  )

  // Fall back only when HTML under-covers ingredientValues:
  // - fewer total non-empty entries, or
  // - fewer unique normalized entries
  // Extra HTML entries are allowed (some sites duplicate DOM nodes for layout)
  if (
    foundIngredients.length < ingredientValues.length ||
    uniqueFoundIngredients.size < uniqueIngredientValues.size
  ) {
    return stringsToIngredients(ingredientValues)
  }

  const groupings = new Map<string | null, string[]>()
  let currentHeading: string | null = null

  // iterate in document order over headings & items
  const elements = $(`${groupNameSelector}, ${ingredientSelector}`).toArray()

  for (const el of elements) {
    const $el = $(el)

    if ($el.is(groupNameSelector)) {
      // it's a heading
      const headingText = normalizeString($el.text()).replace(/:$/, '')
      currentHeading = headingText || null

      if (!groupings.has(currentHeading)) {
        groupings.set(currentHeading, [])
      }
    } else if ($el.is(ingredientSelector)) {
      // it's an ingredient
      const text = normalizeString($el.text())

      if (!text) {
        continue
      }

      const matched = bestMatch(text, ingredientValues)
      const heading = currentHeading ?? null

      if (!groupings.has(heading)) {
        groupings.set(heading, [])
      }

      groupings.get(heading)?.push(matched)
    }
  }

  // Convert Map to Ingredients array
  const result: Ingredients = []

  for (const [name, items] of groupings.entries()) {
    result.push(createIngredientGroup(name, items.map(createIngredientItem)))
  }

  const nonEmptyGroups = result.filter((group) => group.items.length > 0)

  if (nonEmptyGroups.length > 0) {
    return nonEmptyGroups
  }

  return ingredientValues.length > 0
    ? stringsToIngredients(ingredientValues)
    : []
}
