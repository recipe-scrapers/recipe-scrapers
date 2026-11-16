// The first number in the yield text. No surrounding `\D*`: those never
// changed the capture but made a digit-free string backtrack quadratically.
const SERVE_REGEX_NUMBER = /(?<items>\d+(?:\.\d*)?)/

const LINE_BREAK = /\r\n|[\n\r\u2028\u2029]/

/**
 * Returns the parenthetical text in a yield ("(about 120 to 160 crackers)"):
 * from the first `(` to the last `)` on the first line that has both. This
 * is what `/\(.*\)/` matched, without its quadratic backtracking on text
 * with many unclosed `(`.
 */
function findParenthetical(text: string): string | null {
  for (const line of text.split(LINE_BREAK)) {
    const start = line.indexOf('(')
    const end = line.lastIndexOf(')')

    if (start !== -1 && end > start) {
      return line.slice(start, end + 1)
    }
  }

  return null
}

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
 * Each yield type as whole-word patterns, so "Barbecue" is not a `bar` and
 * "cupcakes" is a `cupcake` rather than a `cup`.
 */
const RECIPE_YIELD_TYPE_PATTERNS = RECIPE_YIELD_TYPES.map(([singular, plural]) => ({
  singular,
  plural,
  singularPattern: new RegExp(`\\b${singular}\\b`, 'i'),
  pluralPattern: new RegExp(`\\b${plural}\\b`, 'i'),
}))

/**
 * Returns a string of servings or items. If the recipe is for a number of
 * items (not servings), it returns "x item(s)" where x is the quantity.
 * This function handles cases where the yield is in dozens,
 * such as "4 dozen cookies", returning "4 dozen" instead of "4 servings".
 * Additionally accommodates yields specified in batches
 * (e.g., "2 batches of brownies"), returning the yield as stated.
 *
 * Text without a number, such as "Makes a batch", is returned as written
 * (whitespace collapsed) rather than as a "0" yield, which would read as a
 * recipe that makes nothing.
 *
 * @param value The yield string from the recipe
 * @returns The number of servings, items, dozen, batches, etc...
 */
export function parseYields(element: string): string {
  // Collapsed inline rather than with `normalizeString`: importing
  // `./parsing` would pull the duration parser into the `utils` entry.
  const writtenText = element.replace(/\s+/g, ' ').trim()

  if (!writtenText) {
    throw new Error('Element is required')
  }

  // Not normalized: the parenthetical lookup below reads line by line.
  const serveText = element
  const matched = serveText.match(SERVE_REGEX_NUMBER)?.groups?.items

  if (matched === undefined) {
    return writtenText
  }

  let bestMatch: string | null = null
  let bestMatchLength = 0

  for (const { singular, plural, singularPattern, pluralPattern } of RECIPE_YIELD_TYPE_PATTERNS) {
    const matchLength = singularPattern.test(serveText)
      ? singular.length
      : pluralPattern.test(serveText)
        ? plural.length
        : 0

    if (matchLength > bestMatchLength) {
      bestMatchLength = matchLength
      bestMatch = `${matched} ${Number.parseFloat(matched) === 1 ? singular : plural}`
    }
  }

  // If we found the best match (e.g. "5 cups"), append any trailing
  // parentheses text. That way "5 cups (about 120...)" stays intact.
  if (bestMatch) {
    const parenthetical = findParenthetical(serveText)

    if (parenthetical) {
      // e.g. "5 cups (about 120 to 160 crackers)"
      bestMatch += ` ${parenthetical}`
    }
    return bestMatch
  }

  const amount = Number.parseFloat(matched)
  const plural = amount > 1 || amount === 0 ? 's' : ''

  if (SERVE_REGEX_ITEMS.test(serveText)) {
    return `${matched} item${plural}`
  }

  return `${matched} serving${plural}`
}
