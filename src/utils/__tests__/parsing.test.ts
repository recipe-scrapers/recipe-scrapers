import { describe, expect, it } from 'bun:test'
import { normalizeString, parseMinutes, splitToList } from '../parsing'

describe('normalizeString', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normalizeString('  hello world  ')).toBe('hello world')
  })

  it('collapses multiple whitespace characters into single spaces', () => {
    expect(normalizeString('foo   bar\tbaz\nqux')).toBe('foo bar baz qux')
  })

  it('returns empty string for null or undefined', () => {
    expect(normalizeString(null)).toBe('')
    expect(normalizeString(undefined)).toBe('')
  })

  it('returns empty string for input that becomes empty after trim', () => {
    expect(normalizeString('    ')).toBe('')
  })
})

describe('splitToList', () => {
  it('returns empty array for empty input', () => {
    expect(splitToList('', ',')).toEqual([])
  })

  it('splits by comma and trims items', () => {
    const input = ' apple, banana ,  cherry ,,  '
    expect(splitToList(input, ',')).toEqual(['apple', 'banana', 'cherry'])
  })

  it('splits by custom separator', () => {
    const input = 'one|two| three | |four'
    expect(splitToList(input, '|')).toEqual(['one', 'two', 'three', 'four'])
  })

  it('ignores items that normalize to empty strings', () => {
    const input = 'a,, ,b'
    expect(splitToList(input, ',')).toEqual(['a', 'b'])
  })
})

describe('parseMinutes', () => {
  it('parses hours and minutes', () => {
    expect(parseMinutes('PT1H30M')).toBe(90)
  })

  it('parses only minutes', () => {
    expect(parseMinutes('PT45M')).toBe(45)
  })

  it('parses only seconds and rounds to minutes', () => {
    expect(parseMinutes('PT90S')).toBe(2)
  })

  it('parses hours only', () => {
    expect(parseMinutes('PT2H')).toBe(120)
  })

  it('parses days and hours', () => {
    // 1 day = 24h, +2h = 26h -> 1560 minutes
    expect(parseMinutes('P1DT2H')).toBe(1560)
  })

  it('parses human-readable minutes', () => {
    expect(parseMinutes('Cooks in 15 M')).toBe(15)
  })

  it('parses human-readable mixed units', () => {
    expect(parseMinutes('1 hour 30 minutes')).toBe(90)
  })

  it('throws on invalid input', () => {
    expect(() => parseMinutes('')).toThrow('invalid duration')
  })
})
