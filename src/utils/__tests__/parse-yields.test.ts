import { describe, expect, it } from 'bun:test'

import { parseYields } from '../parse-yields'

describe('parseYields', () => {
  it('should throw for empty input', () => {
    expect(() => parseYields('')).toThrow()
  })

  it('should handle single serving yield', () => {
    expect(parseYields('1 serving')).toBe('1 serving')
  })

  it('should handle plural servings yield', () => {
    expect(parseYields('4 servings')).toBe('4 servings')
  })

  it('should handle item yields', () => {
    expect(parseYields('2 items')).toBe('2 items')
  })

  it('should handle range yields', () => {
    expect(parseYields('4-6 servings')).toBe('4 servings')
  })

  it('should handle "to" range yields', () => {
    expect(parseYields('2 to 3 servings')).toBe('2 servings')
  })

  it('should leave paranthetical information intact', () => {
    expect(parseYields('5 cups (about 120 to 160 crackers)')).toBe(
      '5 cups (about 120 to 160 crackers)',
    )
  })

  it('keeps the parenthetical from the first line that closes one', () => {
    expect(parseYields('5 cups (about 120 (or more) crackers) total')).toBe(
      '5 cups (about 120 (or more) crackers)',
    )
    expect(parseYields('5 cups (unclosed')).toBe('5 cups')
    expect(
      parseYields(`5 cups (about
120 crackers)`),
    ).toBe('5 cups')
    expect(
      parseYields(`5 cups
(about 120 crackers)`),
    ).toBe('5 cups (about 120 crackers)')
  })

  it('throws for whitespace-only input', () => {
    expect(() => parseYields(' \n ')).toThrow()
  })

  it('returns text without a number as written rather than a 0 yield', () => {
    expect(parseYields('Tablespoon')).toBe('Tablespoon')
    expect(parseYields('dozen')).toBe('dozen')
    expect(parseYields('Makes a batch')).toBe('Makes a batch')
    expect(parseYields('Serves a crowd')).toBe('Serves a crowd')
    expect(parseYields('Makes two loaves')).toBe('Makes two loaves')
    expect(parseYields('Barbecue for friends')).toBe('Barbecue for friends')
    expect(parseYields('  Makes\n a batch ')).toBe('Makes a batch')
  })

  it('still reads the yield type when the text has a number', () => {
    expect(parseYields('Makes 2 loaves')).toBe('2 loaves')
    expect(parseYields('1 loaf')).toBe('1 loaf')
    expect(parseYields('2 dozen')).toBe('2 dozen')
    expect(parseYields('12 Cupcakes')).toBe('12 cupcakes')
    expect(parseYields('8 hamburger buns')).toBe('8 hamburger buns')
  })

  it('reads the yield type that follows the number', () => {
    expect(parseYields('4 dozen cookies')).toBe('4 dozen')
    expect(parseYields('1 dozen cookies')).toBe('1 dozen')
    expect(parseYields('24 cookies (2 dozen)')).toBe('24 cookies (2 dozen)')
    expect(parseYields('2 batches of brownies')).toBe('2 batches')
    expect(parseYields('Batch of 24 cookies')).toBe('24 cookies')
    expect(parseYields('1 pound cake')).toBe('1 pound')
  })

  it('falls back to a yield type before the number', () => {
    expect(parseYields('Cookies: 24')).toBe('24 cookies')
  })

  it('matches yield types as whole words', () => {
    expect(parseYields('Barbecue for 4')).toBe('4 servings')
    expect(parseYields('Serves 6 (pieceful)')).toBe('6 servings')
    expect(parseYields('16 bars')).toBe('16 bars')
  })

  it('parses long input in linear time', () => {
    const started = performance.now()

    expect(parseYields(`5 cups ${'('.repeat(200_000)}`)).toBe('5 cups')
    expect(parseYields('a'.repeat(200_000))).toBe('a'.repeat(200_000))
    expect(parseYields(`4 ${'a'.repeat(200_000)}`)).toBe('4 servings')
    expect(performance.now() - started).toBeLessThan(1000)
  })

  it('should be deterministic across repeated calls', () => {
    expect(parseYields('Makes 3')).toBe('3 items')
    expect(parseYields('Makes 3')).toBe('3 items')
    expect(parseYields('Makes 3')).toBe('3 items')
  })
})
