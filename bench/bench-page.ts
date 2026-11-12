import { readFileSync } from 'node:fs'
import path from 'node:path'

import { test } from 'vitest'

import type { AbstractScraper } from '@/abstract-scraper'
import { getScraper, LogLevel, scrapeRecipe, type ScraperOptions } from '@/index'

const DATA_DIR = path.resolve(import.meta.dirname, '../test-data')

/**
 * Registers the two benchmarks for one Recipe Page:
 *
 * - `scrape`: what a consumer pays, Cheerio load plus extraction and validation.
 * - `extract`: extraction and validation only. Cheerio load is about three
 *   quarters of `scrape`, so a regression in our own code shows up more
 *   clearly here.
 *
 * Each page lives in its own bench file so Vitest can run pages in parallel;
 * under CodSpeed simulation one page takes minutes.
 *
 * @param fixture Fixture path under test-data/, without extension.
 */
export function benchPage(fixture: string, options: ScraperOptions = {}) {
  const [host] = fixture.split('/')
  const html = readFileSync(path.join(DATA_DIR, `${fixture}.testhtml`), 'utf8')
  const url = `https://${host}/`
  const scraperOptions = { logLevel: LogLevel.ERROR, ...options }

  test(path.basename(fixture), async ({ bench }) => {
    // Benchmark functions must be `async` functions: CodSpeed only awaits
    // functions whose constructor is AsyncFunction.
    await bench('scrape', async () => {
      await scrapeRecipe(html, url, scraperOptions)
    }).run()

    const Scraper = getScraper(url)
    let scraper: AbstractScraper

    await bench(
      'extract',
      {
        beforeEach: () => {
          scraper = new Scraper(html, url, scraperOptions)
        },
      },
      async () => {
        await scraper.parse()
      },
    ).run()
  })
}
