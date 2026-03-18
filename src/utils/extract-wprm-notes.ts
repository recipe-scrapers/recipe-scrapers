import type { CheerioAPI } from 'cheerio'
import { stringsToNotes } from './notes'
import { normalizeString } from './parsing'

function extractNoteText($: CheerioAPI, selector: Parameters<CheerioAPI>[0]) {
  if (!selector) {
    return undefined
  }

  const text = normalizeString(
    $(selector)
      .text()
      .replace(/\u00A0/g, ' '),
  )
  return text || undefined
}

/**
 * Extracts recipe notes from WP Recipe Maker HTML.
 * Returns a single unnamed note group, or undefined when no note block exists.
 */
export function extractWprmNotes($: CheerioAPI) {
  const recipeContainer = $('.wprm-recipe-container').first()

  const nestedNotes = recipeContainer
    .find('.wprm-recipe-notes-container')
    .first()

  const notesContainer =
    nestedNotes.length > 0
      ? nestedNotes
      : $('.wprm-recipe-notes-container').first()

  if (notesContainer.length === 0) {
    return undefined
  }

  const notesRoot = notesContainer.find('.wprm-recipe-notes').first()

  if (notesRoot.length === 0) {
    return undefined
  }

  const listItemValues = notesRoot
    .find('li')
    .map((_, el) => extractNoteText($, el))
    .get()
    .filter(Boolean)

  if (listItemValues.length > 0) {
    return stringsToNotes(listItemValues)
  }

  const noteValues = notesRoot
    .contents()
    .toArray()
    .flatMap((node) => {
      if (node.type !== 'tag') {
        return []
      }

      const child = $(node)

      if (child.is('.wprm-spacer')) {
        return []
      }

      const text = extractNoteText($, node)
      return text ? [text] : []
    })

  return noteValues.length > 0 ? stringsToNotes(noteValues) : undefined
}
