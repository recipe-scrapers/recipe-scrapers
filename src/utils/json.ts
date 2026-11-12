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
// Each `\s*` is fenced by a required token, so no two quantifiers can
// split the same run of whitespace (linear time on untrusted page input).
const CDATA_OPEN_PATTERN = /^\s*(?:(?:\/\/|\/\*)\s*)?<!\[CDATA\[(?:\s*\*\/)?/
const CDATA_CLOSE_PATTERN = /(?:(?:\/\/|\/\*)\s*)?\]\]>(?:\s*\*\/)?\s*$/

const JSON_WHITESPACE = new Set([' ', '\t', '\n', '\r'])

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
  const unwrapped = raw.replace(CDATA_OPEN_PATTERN, '').replace(CDATA_CLOSE_PATTERN, '')
  // Whitespace left around a removed wrapper is dropped here, not in the
  // patterns, where an extra `\s*` would make them backtrack.
  const input = unwrapped === raw ? raw : unwrapped.trim()
  let repaired = ''
  let inString = false
  let isEscaping = false
  // Position in `repaired` of a comma that only whitespace has followed so far.
  let trailingCommaIndex: number | null = null

  for (const char of input) {
    if (!inString) {
      if ((char === '}' || char === ']') && trailingCommaIndex !== null) {
        repaired = repaired.slice(0, trailingCommaIndex) + repaired.slice(trailingCommaIndex + 1)
      }

      if (char === ',') {
        trailingCommaIndex = repaired.length
      } else if (!JSON_WHITESPACE.has(char)) {
        trailingCommaIndex = null
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
