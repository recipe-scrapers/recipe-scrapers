import type { NoteGroup, NoteItem, Notes } from '@/types/recipe.interface'
import { isPlainObject, isString } from './index'

/**
 * Creates a NoteItem.
 */
export function createNoteItem(value: string): NoteItem {
  return { value }
}

/**
 * Creates a NoteGroup.
 */
export function createNoteGroup(
  name: string | null,
  items: NoteItem[] = [],
): NoteGroup {
  return { name, items }
}

/**
 * Type guard to check if value is a NoteItem.
 */
export function isNoteItem(value: unknown): value is NoteItem {
  return isPlainObject(value) && 'value' in value && isString(value.value)
}

/**
 * Type guard to check if value is a NoteGroup.
 */
export function isNoteGroup(value: unknown): value is NoteGroup {
  return (
    isPlainObject(value) &&
    'name' in value &&
    'items' in value &&
    Array.isArray(value.items) &&
    value.items.every(isNoteItem)
  )
}

/**
 * Type guard to check if value is a Notes array.
 */
export function isNotes(value: unknown): value is Notes {
  return Array.isArray(value) && value.every(isNoteGroup)
}

/**
 * Converts an array of strings to a Notes array with a single default group.
 */
export function stringsToNotes(
  values: string[],
  groupName: string | null = null,
): Notes {
  const items = values.map(createNoteItem)
  return [createNoteGroup(groupName, items)]
}
