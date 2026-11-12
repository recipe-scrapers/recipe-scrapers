export interface JsonParseResult {
  data: unknown
  repaired: boolean
}

function escapeControlCharacter(value: string): string {
  switch (value) {
    case '\b':
      return '\\b'
    case '\f':
      return '\\f'
    case '\n':
      return '\\n'
    case '\r':
      return '\\r'
    case '\t':
      return '\\t'
    default: {
      const code = value.charCodeAt(0).toString(16).toUpperCase()
      return `\\u${code.padStart(4, '0')}`
    }
  }
}

/**
 * Matches a CDATA wrapper left around a script's JSON, written as a JS
 * comment (`// <![CDATA[` … `// ]]>`) or block comment (`/*<![CDATA[*\/`).
 */
const CDATA_OPEN_PATTERN = /^\s*(?:\/\/|\/\*)?\s*<!\[CDATA\[\s*(?:\*\/)?/
const CDATA_CLOSE_PATTERN = /(?:\/\/|\/\*)?\s*\]\]>\s*(?:\*\/)?\s*$/

/**
 * Repairs common syntax errors in hand-written or templated JSON-LD:
 *
 * - a CDATA comment wrapper around the JSON
 * - raw control characters (newlines, tabs) inside string literals
 * - `\'` escapes inside string literals, which JSON does not allow
 * - trailing commas before `}` or `]`
 *
 * Everything else is left untouched, so valid JSON is returned unchanged.
 */
export function repairJson(raw: string): string {
  const input = raw.replace(CDATA_OPEN_PATTERN, '').replace(CDATA_CLOSE_PATTERN, '')
  let repaired = ''
  let inString = false
  let isEscaping = false

  for (const char of input) {
    if (!inString) {
      if (char === '}' || char === ']') {
        repaired = repaired.replace(/,(\s*)$/, '$1')
      }

      repaired += char

      if (char === '"') {
        inString = true
      }
      continue
    }

    if (isEscaping) {
      repaired += char === "'" ? "'" : `\\${char}`
      isEscaping = false
      continue
    }

    if (char === '\\') {
      isEscaping = true
      continue
    }

    if (char === '"') {
      repaired += char
      inString = false
      continue
    }

    if (char.charCodeAt(0) <= 0x1f) {
      repaired += escapeControlCharacter(char)
      continue
    }

    repaired += char
  }

  return repaired
}

/**
 * Parses JSON and attempts a syntax repair pass (see `repairJson`) if initial
 * parsing fails.
 * Throws the original parse error if repair is not applicable/successful.
 */
export function parseJsonWithRepair(raw: string): JsonParseResult {
  try {
    return { data: JSON.parse(raw), repaired: false }
  } catch (error) {
    const repairedRaw = repairJson(raw)

    if (repairedRaw === raw) {
      throw error
    }

    try {
      return { data: JSON.parse(repairedRaw), repaired: true }
    } catch {
      throw error
    }
  }
}
