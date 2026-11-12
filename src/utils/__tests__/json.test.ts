import { describe, expect, it } from 'bun:test'

import { parseJsonWithRepair, repairJson } from '../json'

describe('repairJson', () => {
  it('escapes raw newline characters inside JSON strings', () => {
    const raw = '{"text":"line1\nline2"}'
    const repaired = repairJson(raw)

    expect(repaired).toBe('{"text":"line1\\nline2"}')
  })

  it('does not alter control characters outside JSON strings', () => {
    const raw = '{\n  "name": "value"\n}'
    const repaired = repairJson(raw)

    expect(repaired).toBe(raw)
  })

  it('preserves already escaped sequences', () => {
    const raw = '{"text":"line1\\\\nline2","quote":"say \\"hi\\"","path":"a\\/b"}'
    const repaired = repairJson(raw)

    expect(repaired).toBe(raw)
  })

  it("replaces \\' escapes inside strings with a plain apostrophe", () => {
    expect(repairJson(String.raw`{"name":"Mom\'s Chili"}`)).toBe(`{"name":"Mom's Chili"}`)
  })

  it('removes trailing commas before closing braces and brackets', () => {
    expect(repairJson('{"a": [1, 2, ], "b": {"c": 3,\n },\n}')).toBe(
      '{"a": [1, 2 ], "b": {"c": 3\n }\n}',
    )
  })

  it('keeps commas followed by a bracket inside strings', () => {
    const raw = '{"text":"a, ]"}'

    expect(repairJson(raw)).toBe(raw)
  })

  it('strips a CDATA comment wrapper', () => {
    expect(repairJson('\n\t// <![CDATA[\n{"a":1}// ]]>\n')).toBe('{"a":1}')
    expect(repairJson('/*<![CDATA[*/{"a":1}/*]]>*/')).toBe('{"a":1}')
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

  it('repairs and parses templated JSON-LD with several syntax errors', () => {
    const raw = `// <![CDATA[
{
  "@type": "Recipe",
  "name": "Mom\\'s Salad",
  "recipeIngredient": [
  ],
  "recipeCategory": "Salads",
}
// ]]>`
    const result = parseJsonWithRepair(raw)

    expect(result.repaired).toBe(true)
    expect(result.data).toEqual({
      '@type': 'Recipe',
      name: "Mom's Salad",
      recipeIngredient: [],
      recipeCategory: 'Salads',
    })
  })

  it('throws when JSON cannot be repaired', () => {
    expect(() => parseJsonWithRepair('{"name":"missing brace"')).toThrow()
  })
})
