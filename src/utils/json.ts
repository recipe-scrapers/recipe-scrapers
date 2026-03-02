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
 * Escapes raw control characters within JSON string literals.
 *
 * This is a focused repair pass intended for malformed JSON-LD where values
 * contain unescaped newlines/tabs or other ASCII control chars.
 */
export function repairJsonControlCharactersInStrings(raw: string): string {
  let repaired = ''
  let inString = false
  let isEscaping = false

  for (const char of raw) {
    if (!inString) {
      repaired += char

      if (char === '"') {
        inString = true
      }
      continue
    }

    if (isEscaping) {
      repaired += char
      isEscaping = false
      continue
    }

    if (char === '\\') {
      repaired += char
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
 * Parses JSON and attempts a control-character repair pass if initial parsing
 * fails.
 * Throws the original parse error if repair is not applicable/successful.
 */
export function parseJsonWithRepair(raw: string): JsonParseResult {
  try {
    return { data: JSON.parse(raw), repaired: false }
  } catch (error) {
    const repairedRaw = repairJsonControlCharactersInStrings(raw)

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
