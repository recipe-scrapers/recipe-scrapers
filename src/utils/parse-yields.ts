const SERVE_REGEX_NUMBER = /(?:\D*(?<items>\d+(?:\.\d*)?)\D*)/

const SERVE_REGEX_ITEMS =
  /\bsandwiches\b|\btacquitos\b|\bmakes\b|\bcups\b|\bappetizer\b|\bporzioni\b|\bcookies\b|\b(large |small )?buns\b/i

const RECIPE_YIELD_TYPES: [string, string][] = [
  ['dozen', 'dozen'],
  ['batch', 'batches'],
  ['cake', 'cakes'],
  ['sandwich', 'sandwiches'],
  ['bun', 'buns'],
  ['cookie', 'cookies'],
  ['muffin', 'muffins'],
  ['cupcake', 'cupcakes'],
  ['loaf', 'loaves'],
  ['pie', 'pies'],
  ['cup', 'cups'],
  ['pint', 'pints'],
  ['gallon', 'gallons'],
  ['ounce', 'ounces'],
  ['pound', 'pounds'],
  ['gram', 'grams'],
  ['liter', 'liters'],
  ['piece', 'pieces'],
  ['layer', 'layers'],
  ['scoop', 'scoops'],
  ['bar', 'bars'],
  ['patty', 'patties'],
  ['hamburger bun', 'hamburger buns'],
  ['pancake', 'pancakes'],
  ['item', 'items'],
  // ... add more types as needed, in [singular, plural] format ...
]

/**
 * Returns a string of servings or items. If the recipe is for a number of
 * items (not servings), it returns "x item(s)" where x is the quantity.
 * This function handles cases where the yield is in dozens,
 * such as "4 dozen cookies", returning "4 dozen" instead of "4 servings".
 * Additionally accommodates yields specified in batches
 * (e.g., "2 batches of brownies"), returning the yield as stated.
 *
 * @param value The yield string from the recipe
 * @returns The number of servings, items, dozen, batches, etc...
 */
export function parseYields(element: string): string {
  if (!element) {
    throw new Error('Element is required')
  }

  const serveText = element

  const match = serveText.match(SERVE_REGEX_NUMBER)
  const matched = match?.groups?.items || '0'

  const serveTextLower = serveText.toLowerCase()
  let bestMatch: string | null = null
  let bestMatchLength = 0

  for (const [singular, plural] of RECIPE_YIELD_TYPES) {
    if (serveTextLower.includes(singular) || serveTextLower.includes(plural)) {
      const matchLength = serveTextLower.includes(singular)
        ? singular.length
        : plural.length
      if (matchLength > bestMatchLength) {
        bestMatchLength = matchLength
        bestMatch = `${matched} ${Number.parseFloat(matched) === 1 ? singular : plural}`
      }
    }
  }

  // If we found the best match (e.g. "5 cups"), append any trailing
  // parentheses text. That way "5 cups (about 120...)" stays intact.
  if (bestMatch) {
    const parenMatch = serveText.match(/\(.*\)/)

    if (parenMatch) {
      // e.g. "5 cups (about 120 to 160 crackers)"
      bestMatch += ` ${parenMatch[0]}`
    }
    return bestMatch
  }

  const plural =
    Number.parseFloat(matched) > 1 || Number.parseFloat(matched) === 0
      ? 's'
      : ''

  if (SERVE_REGEX_ITEMS.test(serveText)) {
    return `${matched} item${plural}`
  }

  return `${matched} serving${plural}`
}
