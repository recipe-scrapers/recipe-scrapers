import { describe, expect, it } from 'bun:test'

import { normalizeString, parseMinutes, splitToList, stripLeadingBullet } from '../parsing'

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

  it('removes zero-width spaces and byte order marks', () => {
    expect(normalizeString('\u200b1 xícara de arroz')).toBe('1 xícara de arroz')
    expect(normalizeString('\ufeffsalt to\u200b taste')).toBe('salt to taste')
    expect(normalizeString('\u200b \u200b')).toBe('')
  })

  it('keeps zero-width joiners used in emoji sequences', () => {
    expect(normalizeString('chef 👨\u200d🍳')).toBe('chef 👨\u200d🍳')
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

describe('stripLeadingBullet', () => {
  it('removes common leading bullet markers', () => {
    expect(stripLeadingBullet('\u25aa 1 cup flour')).toBe('1 cup flour')
    expect(stripLeadingBullet('\u2022 1 cup flour')).toBe('1 cup flour')
    expect(stripLeadingBullet('* 1 cup flour')).toBe('1 cup flour')
    expect(stripLeadingBullet('- 1 cup flour')).toBe('1 cup flour')
  })

  it('leaves non-bulleted values normalized', () => {
    expect(stripLeadingBullet('  1   cup flour  ')).toBe('1 cup flour')
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

  it('parses human-readable durations in other European languages', () => {
    expect(parseMinutes('35 minuti')).toBe(35)
    expect(parseMinutes('Tillagningstid\n   30 minuter')).toBe(30)
    expect(parseMinutes('1 Stunde 15 Minuten')).toBe(75)
    expect(parseMinutes('1,5 timer')).toBe(90)
    expect(parseMinutes('2 horas')).toBe(120)
    expect(parseMinutes('1 heure 10 minutes')).toBe(70)
    expect(parseMinutes('45 minuten')).toBe(45)
  })

  it('parses long unit-less input in linear time', () => {
    const started = performance.now()

    expect(() => parseMinutes('1'.repeat(200_000))).toThrow('invalid duration')
    expect(performance.now() - started).toBeLessThan(1000)
  })

  it('does not read a unit out of a longer word', () => {
    expect(() => parseMinutes('serves 4 people')).toThrow('invalid duration')
    expect(parseMinutes('10 minutes, then 2 more')).toBe(10)
  })

  it('throws on invalid input', () => {
    expect(() => parseMinutes('')).toThrow('invalid duration')
  })
})
