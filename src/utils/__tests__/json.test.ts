import { describe, expect, it } from 'bun:test'
import {
  parseJsonWithRepair,
  repairJsonControlCharactersInStrings,
} from '../json'

describe('repairJsonControlCharactersInStrings', () => {
  it('escapes raw newline characters inside JSON strings', () => {
    const raw = '{"text":"line1\nline2"}'
    const repaired = repairJsonControlCharactersInStrings(raw)

    expect(repaired).toBe('{"text":"line1\\nline2"}')
  })

  it('does not alter control characters outside JSON strings', () => {
    const raw = '{\n  "name": "value"\n}'
    const repaired = repairJsonControlCharactersInStrings(raw)

    expect(repaired).toBe(raw)
  })

  it('preserves already escaped sequences', () => {
    const raw = '{"text":"line1\\\\nline2"}'
    const repaired = repairJsonControlCharactersInStrings(raw)

    expect(repaired).toBe(raw)
  })
})

describe('parseJsonWithRepair', () => {
  it('parses valid JSON without repair', () => {
    const result = parseJsonWithRepair('{"name":"ok"}')

    expect(result.repaired).toBe(false)
    expect(result.data).toEqual({ name: 'ok' })
  })

  it('repairs and parses JSON with raw control chars inside strings', () => {
    const result = parseJsonWithRepair('{"text":"line1\nline2"}')

    expect(result.repaired).toBe(true)
    expect(result.data).toEqual({ text: 'line1\nline2' })
  })

  it('throws when JSON cannot be repaired', () => {
    expect(() => parseJsonWithRepair('{"name":"missing brace"')).toThrow()
  })
})
