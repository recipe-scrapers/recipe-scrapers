import { describe, expect, it } from 'bun:test'
import {
  createNoteGroup,
  createNoteItem,
  isNoteGroup,
  isNoteItem,
  isNotes,
  stringsToNotes,
} from '../notes'

describe('createNoteItem', () => {
  it('creates a note item with value', () => {
    expect(createNoteItem('Use within 3 days.')).toEqual({
      value: 'Use within 3 days.',
    })
  })
})

describe('createNoteGroup', () => {
  it('creates a group with name and items', () => {
    const group = createNoteGroup('Storage', [createNoteItem('Keep chilled.')])
    expect(group).toEqual({
      name: 'Storage',
      items: [{ value: 'Keep chilled.' }],
    })
  })

  it('creates a group with null name', () => {
    expect(createNoteGroup(null, [createNoteItem('Serve warm.')])).toEqual({
      name: null,
      items: [{ value: 'Serve warm.' }],
    })
  })
})

describe('isNoteItem', () => {
  it('returns true for valid note item', () => {
    expect(isNoteItem({ value: 'Toast before serving.' })).toBe(true)
  })

  it('returns false for invalid values', () => {
    expect(isNoteItem(null)).toBe(false)
    expect(isNoteItem(undefined)).toBe(false)
    expect(isNoteItem('string')).toBe(false)
    expect(isNoteItem({ value: 123 })).toBe(false)
    expect(isNoteItem({})).toBe(false)
  })
})

describe('isNoteGroup', () => {
  it('returns true for valid note group', () => {
    expect(
      isNoteGroup({
        name: null,
        items: [{ value: 'Use within 3 days.' }],
      }),
    ).toBe(true)
  })

  it('returns false for invalid values', () => {
    expect(isNoteGroup(null)).toBe(false)
    expect(isNoteGroup({ name: 'test' })).toBe(false)
    expect(isNoteGroup({ items: [] })).toBe(false)
  })
})

describe('isNotes', () => {
  it('returns true for valid notes array', () => {
    expect(
      isNotes([{ name: null, items: [{ value: 'Step away from heat.' }] }]),
    ).toBe(true)
    expect(isNotes([])).toBe(true)
  })

  it('returns false for invalid values', () => {
    expect(isNotes(null)).toBe(false)
    expect(isNotes('string')).toBe(false)
    expect(isNotes([{ invalid: true }])).toBe(false)
  })
})

describe('stringsToNotes', () => {
  it('converts string array to notes with null group name', () => {
    expect(stringsToNotes(['Use within 3 days.', 'Do not freeze.'])).toEqual([
      {
        name: null,
        items: [{ value: 'Use within 3 days.' }, { value: 'Do not freeze.' }],
      },
    ])
  })

  it('returns single empty group for empty input', () => {
    expect(stringsToNotes([])).toEqual([{ name: null, items: [] }])
  })
})
