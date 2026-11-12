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

function parseHumanDurationMinutes(value: string): number | null {
  const normalized = normalizeString(value).toLowerCase()

  if (!normalized) {
    return null
  }

  const matches = Array.from(
    normalized.matchAll(
      /(\d+(?:\.\d+)?)\s*(days?|d|hours?|hrs?|hr|h|minutes?|mins?|min|m|seconds?|secs?|sec|s)\b/g,
    ),
  )

  if (matches.length === 0) {
    return null
  }

  let totalMinutes = 0

  for (const match of matches) {
    const amount = Number.parseFloat(match[1] ?? '')
    const unit = match[2] ?? ''

    if (Number.isNaN(amount)) {
      continue
    }

    if (/^days?$|^d$/.test(unit)) {
      totalMinutes += amount * 24 * 60
      continue
    }

    if (/^hours?$|^hrs?$|^hr$|^h$/.test(unit)) {
      totalMinutes += amount * 60
      continue
    }

    if (/^minutes?$|^mins?$|^min$|^m$/.test(unit)) {
      totalMinutes += amount
      continue
    }

    if (/^seconds?$|^secs?$|^sec$|^s$/.test(unit)) {
      totalMinutes += amount / 60
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
