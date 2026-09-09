import { describe, expect, it } from 'bun:test'

import z from 'zod'

import { AbstractScraper } from '@/abstract-scraper'
import { LogLevel } from '@/logger'
import { scrapers } from '@/scrapers/_index'

import { loadTestFixtureCatalog, type SupportedHostTestFixtures } from './test-fixture-catalog'

const DATA_DIR = './test-data'

function runTestSuite({
  host,
  aliases,
  scraperClass: Scraper,
  fixtures,
}: SupportedHostTestFixtures) {
  describe(`Scraper: ${host}`, () => {
    it('should be an instance of AbstractScraper', () => {
      expect(new Scraper('', '')).toBeInstanceOf(AbstractScraper)
    })

    it('should have a valid host', () => {
      expect(Scraper.host()).toBe(host)
    })

    for (const alias of aliases) {
      it(`should register alias ${alias}`, () => {
        expect(scrapers[alias]).toBe(Scraper)
      })
    }

    for (const fixture of fixtures) {
      describe(fixture.name, () => {
        it('should correctly parse and validate the recipe', async () => {
          const scraper = new Scraper(fixture.html, host, {
            logLevel: LogLevel.ERROR,
            ...fixture.options,
          })
          const data = await scraper.toRecipeObject()
          expect(data).toEqual(fixture.expected)

          const parsedResult = await scraper.safeParse()

          if (!parsedResult.success) {
            console.error(z.prettifyError(parsedResult.error))
          }

          expect(parsedResult.success).toBe(true)

          if (parsedResult.success) {
            expect(parsedResult.data).toMatchObject(fixture.expected)
          }
        })
      })
    }
  })
}

const fixtureCatalog = await loadTestFixtureCatalog(scrapers, DATA_DIR)

const onlyScraper = '' //'epicurious.com'

for (const supportedHost of fixtureCatalog) {
  if (onlyScraper && supportedHost.host !== onlyScraper) continue
  runTestSuite(supportedHost)
}
