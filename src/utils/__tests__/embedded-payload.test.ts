import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'

import { load } from 'cheerio'

import { Logger, LogLevel } from '@/logger'

import { embeddedPayload } from '../embedded-payload'

type Payload = { recipe: { title: string } }

function isPayload(data: unknown): data is Payload {
  if (typeof data !== 'object' || data === null || !('recipe' in data)) {
    return false
  }

  const { recipe } = data
  return typeof recipe === 'object' && recipe !== null && 'title' in recipe
}

const parsePayload = (data: unknown): Payload | null => (isPayload(data) ? data : null)

function pageWith(script: string) {
  return load(`<html><body>${script}<p>Recipe</p></body></html>`)
}

describe('embeddedPayload', () => {
  const logger = new Logger('test', LogLevel.WARN)
  let warnSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    warnSpy = spyOn(logger, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('reads and validates the payload', () => {
    const $ = pageWith(
      '<script id="__NEXT_DATA__" type="application/json">{"recipe":{"title":"Pie"}}</script>',
    )
    const read = embeddedPayload($, { selector: '#__NEXT_DATA__', parse: parsePayload, logger })

    expect(read()).toEqual({ recipe: { title: 'Pie' } })
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('reads the first matching element', () => {
    const $ = pageWith(`
      <script type="application/json">{"recipe":{"title":"First"}}</script>
      <script type="application/json">{"recipe":{"title":"Second"}}</script>
    `)
    const read = embeddedPayload($, {
      selector: 'script[type="application/json"]',
      parse: parsePayload,
      logger,
    })

    expect(read()?.recipe.title).toBe('First')
  })

  it('repairs raw control characters in JSON strings', () => {
    const $ = pageWith('<script id="data">{"recipe":{"title":"Apple\nPie"}}</script>')
    const read = embeddedPayload($, { selector: '#data', parse: parsePayload, logger })

    expect(read()?.recipe.title).toBe('Apple\nPie')
  })

  it('returns null and warns when the payload is missing', () => {
    const read = embeddedPayload(pageWith(''), {
      selector: '#__NEXT_DATA__',
      parse: parsePayload,
      logger,
      name: 'test data',
    })

    expect(read()).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith('Could not find test data payload')
  })

  it('returns null and warns when the payload element is empty', () => {
    const read = embeddedPayload(pageWith('<script id="data">  </script>'), {
      selector: '#data',
      parse: parsePayload,
      logger,
    })

    expect(read()).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith('Could not find #data payload')
  })

  it('returns null and warns when the JSON is malformed', () => {
    const read = embeddedPayload(pageWith('<script id="data">{"recipe":</script>'), {
      selector: '#data',
      parse: parsePayload,
      logger,
    })

    expect(read()).toBeNull()
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0]?.[0]).toBe('Failed to parse #data payload')
  })

  it('returns null and warns when the validator rejects the payload', () => {
    const read = embeddedPayload(pageWith('<script id="data">{"other":true}</script>'), {
      selector: '#data',
      parse: parsePayload,
      logger,
    })

    expect(read()).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith('#data payload does not have the expected shape')
  })

  it('returns null and logs the error when the validator throws', () => {
    const error = new Error('invalid payload')
    const read = embeddedPayload(pageWith('<script id="data">{"other":true}</script>'), {
      selector: '#data',
      parse: () => {
        throw error
      },
      logger,
    })

    expect(read()).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith('Failed to validate #data payload', error)
  })

  it('reads the payload once and caches the result', () => {
    let parseCount = 0
    const read = embeddedPayload(
      pageWith('<script id="data">{"recipe":{"title":"Pie"}}</script>'),
      {
        selector: '#data',
        parse: (data) => {
          parseCount++
          return parsePayload(data)
        },
        logger,
      },
    )

    expect(read()).toBe(read())
    expect(parseCount).toBe(1)
  })

  it('caches a failed read so failures are logged once', () => {
    const read = embeddedPayload(pageWith(''), { selector: '#data', parse: parsePayload, logger })

    expect(read()).toBeNull()
    expect(read()).toBeNull()
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })
})
