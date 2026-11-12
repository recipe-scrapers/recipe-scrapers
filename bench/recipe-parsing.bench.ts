import { readFileSync } from 'node:fs'
import path from 'node:path'

import { test } from 'vitest'

import type { AbstractScraper } from '@/abstract-scraper'
import { getScraper, LogLevel, scrapeRecipe, type ScraperOptions } from '@/index'

type BenchPage = {
  /** Fixture path under test-data/, without extension. */
  fixture: string
  options?: ScraperOptions
}

/**
 * One Recipe Page per extraction path, so a regression in any path moves at
 * least one benchmark. CodSpeed reports a benchmark per page, which keeps a
 * slowdown in one path from being averaged away by the others.
 */
const PAGES: BenchPage[] = [
  // WPRM blog on a Schema.org-only Host: the most common page shape.
  { fixture: 'thecookierookie.com/thecookierookie_1' },
  // Custom Scraper with ingredient parsing and notes.
  {
    fixture: 'cooking.nytimes.com/nytimes_notes',
    options: { parseIngredients: true, parseNotes: true },
  },
  // Microdata with no JSON-LD.
  { fixture: 'epicurious.com/epicurious' },
  // Largest page (about 2 MB), with an embedded JSON payload.
  {
    fixture: 'weightwatchers.com/weightwatcherspublic_2',
    options: { fallbackDescription: 'No description provided' },
  },
  // Smallest page (about 30 KB): fixed per-page overhead.
  { fixture: 'akispetretzikis.com/akispetretzikis' },
]

const DATA_DIR = path.resolve(import.meta.dirname, '../test-data')

function loadPage({ fixture, options }: BenchPage) {
  const [host] = fixture.split('/')
  const html = readFileSync(path.join(DATA_DIR, `${fixture}.testhtml`), 'utf8')
  const url = `https://${host}/`

  return {
    name: path.basename(fixture),
    html,
    url,
    options: { logLevel: LogLevel.ERROR, ...options },
  }
}

for (const page of PAGES.map(loadPage)) {
  test(page.name, async ({ bench }) => {
    // Benchmark functions must be `async` functions: CodSpeed only awaits
    // functions whose constructor is AsyncFunction.

    // What a consumer pays: Cheerio load, extraction, and validation.
    await bench('scrape', async () => {
      await scrapeRecipe(page.html, page.url, page.options)
    }).run()

    // Extraction and validation only. Cheerio load is about three quarters of
    // `scrape`, so a regression in our own code shows up more clearly here.
    const Scraper = getScraper(page.url)
    let scraper: AbstractScraper

    await bench(
      'extract',
      {
        beforeEach: () => {
          scraper = new Scraper(page.html, page.url, page.options)
        },
      },
      async () => {
        await scraper.parse()
      },
    ).run()
  })
}
