import type { CheerioAPI } from 'cheerio'

import type { Logger } from '@/logger'

import { parseJsonWithRepair } from './json'

export interface EmbeddedPayloadOptions<T> {
  /** Selector for the element holding the JSON payload; the first match is read. */
  selector: string
  /**
   * Validates the parsed JSON, returning the payload, or `null` (or throwing)
   * when it does not have the expected shape. A thrown error is logged with
   * the warning. Kept library-agnostic so Scrapers can use a type guard or
   * any synchronous validator.
   */
  parse: (data: unknown) => T | null
  /** Logger used to report missing, malformed, or invalid payloads. */
  logger: Logger
  /** Payload name used in log messages. Defaults to the selector. */
  name?: string
}

/**
 * Creates a reader for a JSON payload embedded in the Recipe Page, such as a
 * `__NEXT_DATA__` script.
 *
 * The payload is read once and the result is cached, including failures. The
 * reader never throws: a missing, malformed, or invalid payload is logged as a
 * warning and returns `null`, leaving any fallback to the Scraper.
 */
export function embeddedPayload<T>(
  $: CheerioAPI,
  { selector, parse, logger, name = selector }: EmbeddedPayloadOptions<T>,
): () => T | null {
  let result: { value: T | null } | undefined

  const load = (): T | null => {
    const raw = $(selector).first().html()

    if (!raw?.trim()) {
      logger.warn(`Could not find ${name} payload`)
      return null
    }

    let data: unknown

    try {
      data = parseJsonWithRepair(raw).data
    } catch (error) {
      logger.warn(`Failed to parse ${name} payload`, error)
      return null
    }

    try {
      const value = parse(data)

      if (value === null) {
        logger.warn(`${name} payload does not have the expected shape`)
      }

      return value
    } catch (error) {
      logger.warn(`Failed to validate ${name} payload`, error)
      return null
    }
  }

  return () => {
    result ??= { value: load() }
    return result.value
  }
}
