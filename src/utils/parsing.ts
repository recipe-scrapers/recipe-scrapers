/*******************************************************************************
 * Utility functions for common parsing tasks
 ******************************************************************************/
import { parse as parseDuration, toSeconds } from 'iso8601-duration'

/**
 * Invisible characters that carry no meaning in recipe text: the zero-width
 * space and the byte order mark. Joiners (U+200C, U+200D) are kept because
 * they matter in emoji sequences and some scripts.
 */
const INVISIBLE_CHARACTERS = /[\u200b\ufeff]/g

export function normalizeString(str: string | null | undefined): string {
  return (
    str
      ?.replace(INVISIBLE_CHARACTERS, '')
      .trim()
      // collapse all whitespace to single spaces
      .replace(/\s+/g, ' ')
      // remove any space(s) immediately before a comma
      .replace(/\s+,/g, ',') ?? ''
  )
}

export function stripLeadingBullet(value: string): string {
  return normalizeString(value.replace(/^[\u2022\u25aa*-]\s*/, ''))
}

export function splitToList(value: string, separator: string | RegExp): string[] {
  if (!value) return []

  const items: string[] = []

  for (const item of value.split(separator)) {
    const str = normalizeString(item)

    if (str) {
      items.push(str)
    }
  }

  return items
}

/**
 * Duration unit names, in minutes, for English and common European
 * languages (German, Dutch, French, Italian, Spanish, Portuguese, and the
 * Scandinavian languages), e.g. "35 minuti" or "30 minuter".
 */
const DURATION_UNITS: readonly (readonly [string, number])[] = [
  [
    'days day tage tag dagen jours jour giorni giorno días dias día dia dagar dager dage dag d',
    24 * 60,
  ],
  [
    'hours hour hrs hr stunden stunde std uur heures heure ore ora horas hora timmar timme timer time h',
    60,
  ],
  ['minutes minute mins min minuten minuut minuti minuto minutos minuter minutter minutt m', 1],
  [
    'seconds second secs sec sekunden sekunde seconden secondes secondi segundos sekunder s',
    1 / 60,
  ],
]

const UNIT_MINUTES = new Map(
  DURATION_UNITS.flatMap(([names, minutes]) =>
    names.split(' ').map((name) => [name, minutes] as const),
  ),
)

// An amount is a whole number with an optional decimal part (`1.5`, `1,5`),
// mixed fraction (`1 1/2`), or plain fraction (`1/2`). Longest unit names
// come first, so "minuten" is tried before "min" and "m". The lookbehind
// starts each match at the first digit of a number and never right after a
// `/`, so a denominator is not read as the amount, and a long run of digits
// is scanned once rather than once per digit (linear, not quadratic, on
// untrusted page input).
const DURATION_PATTERN = new RegExp(
  `(?<![\\d/])(?<whole>\\d+)(?:(?<decimal>[.,]\\d+)|\\s+(?<numerator>\\d+)/(?<mixedDenominator>\\d+)|/(?<denominator>\\d+))?\\s*(?<unit>${[...UNIT_MINUTES.keys()].sort((a, b) => b.length - a.length).join('|')})(?![\\p{L}])`,
  'gu',
)

/** Unicode vulgar fractions, `¼ ½ ¾` and `⅐` through `⅞`. */
const VULGAR_FRACTIONS = /[¼-¾⅐-⅞]/g

/**
 * Rewrites vulgar fractions and the fraction slash as ASCII, so `1½` and
 * `1 ½` both become `1 1/2`. Only the fraction characters are decomposed;
 * NFKD on the whole string would split accented unit names such as "días".
 */
function asciiFractions(value: string): string {
  return value
    .replace(VULGAR_FRACTIONS, (fraction) => ` ${fraction.normalize('NFKD')}`)
    .replace(/⁄/g, '/')
}

function parseAmount({
  whole = '',
  decimal,
  numerator,
  mixedDenominator,
  denominator,
}: Partial<Record<string, string>>): number {
  if (decimal !== undefined) {
    return Number.parseFloat(`${whole}${decimal.replace(',', '.')}`)
  }

  if (numerator !== undefined && mixedDenominator !== undefined) {
    return Number(whole) + Number(numerator) / Number(mixedDenominator)
  }

  if (denominator !== undefined) {
    return Number(whole) / Number(denominator)
  }

  return Number(whole)
}

function parseHumanDurationMinutes(value: string): number | null {
  const normalized = normalizeString(asciiFractions(value)).toLowerCase()

  if (!normalized) {
    return null
  }

  const matches = Array.from(normalized.matchAll(DURATION_PATTERN))

  if (matches.length === 0) {
    return null
  }

  let totalMinutes = 0

  for (const { groups = {} } of matches) {
    const amount = parseAmount(groups)
    const minutes = UNIT_MINUTES.get(groups.unit ?? '')

    // Finite rules out NaN and a zero denominator such as "1/0 hours".
    if (Number.isFinite(amount) && minutes !== undefined) {
      totalMinutes += amount * minutes
    }
  }

  return totalMinutes > 0 ? Math.round(totalMinutes) : 0
}

/**
 * @TODO Implement [Temporal.Duration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Duration) once it lands.
 */
export function parseMinutes(value: string) {
  try {
    const duration = parseDuration(value)
    const totalSeconds = toSeconds(duration)
    return Math.round(totalSeconds / 60)
  } catch (error) {
    const humanDurationMinutes = parseHumanDurationMinutes(value)

    if (humanDurationMinutes !== null) {
      return humanDurationMinutes
    }

    throw error
  }
}
