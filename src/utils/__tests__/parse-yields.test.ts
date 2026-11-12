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

  it('parses long input in linear time', () => {
    const started = performance.now()

    expect(parseYields(`5 cups ${'('.repeat(200_000)}`)).toBe('5 cups')
    expect(parseYields('a'.repeat(200_000))).toBe('0 servings')
    expect(performance.now() - started).toBeLessThan(1000)
  })

  it('should be deterministic across repeated calls', () => {
    expect(parseYields('Makes 3')).toBe('3 items')
    expect(parseYields('Makes 3')).toBe('3 items')
    expect(parseYields('Makes 3')).toBe('3 items')
  })
})
