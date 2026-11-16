import type { Cheerio, CheerioAPI } from 'cheerio'
import type { AnyNode } from 'domhandler'

import { isString } from '.'
import { normalizeString } from './parsing'

/**
 * Recipe Page markup a Site-specific Extractor reads as groups of text, such
 * as steps under method headings.
 */
export interface TextGroupStructure {
  /** Selector matching group headings, read in document order with the items. */
  heading?: string
  /** Selector matching each item. */
  item: string
  /** Selector for descendants of an item to leave out, such as images or labels. */
  exclude?: string
}

/** Items read from the Recipe Page under the heading before them. */
export interface TextGroup {
  name: string | null
  items: string[]
}

function elementText($element: Cheerio<AnyNode>, exclude: string | undefined): string {
  if (exclude && $element.find(exclude).length > 0) {
    return normalizeString($element.clone().find(exclude).remove().end().text())
  }

  return normalizeString($element.text())
}

/**
 * Returns the normalized text of each element `target` matches, in document
 * order, skipping elements with no text.
 *
 * @param $ Cheerio instance for the Recipe Page
 * @param target Selector, or elements already selected
 * @param exclude Selector for descendants to leave out of each element's text
 */
export function texts(
  $: CheerioAPI,
  target: string | Cheerio<AnyNode>,
  exclude?: string,
): string[] {
  const $elements = isString(target) ? $(target) : target

  return $elements
    .toArray()
    .map((element) => elementText($(element), exclude))
    .filter((text) => text.length > 0)
}

/**
 * Reads items grouped under the heading before them, in document order. A
 * heading's trailing colon is dropped, items before the first heading form an
 * unnamed group, and groups without items are left out.
 */
export function textGroups(
  $: CheerioAPI,
  { heading, item, exclude }: TextGroupStructure,
): TextGroup[] {
  if (!heading) {
    const items = texts($, item, exclude)
    return items.length > 0 ? [{ name: null, items }] : []
  }

  const groups: TextGroup[] = []
  let current: TextGroup = { name: null, items: [] }

  for (const element of $(`${heading}, ${item}`).toArray()) {
    const $element = $(element)

    if ($element.is(heading)) {
      if (current.items.length > 0) groups.push(current)
      current = { name: normalizeString($element.text()).replace(/:$/, '') || null, items: [] }
      continue
    }

    const text = elementText($element, exclude)
    if (text) current.items.push(text)
  }

  if (current.items.length > 0) groups.push(current)

  return groups
}
