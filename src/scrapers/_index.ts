import { AbstractScraper } from '@/abstract-scraper'
import type { ScraperOptions } from '@/types/scraper.interface'
import { AmericasTestKitchen } from './americastestkitchen'
import { BBCGoodFood } from './bbcgoodfood'
import { Epicurious } from './epicurious'
import { NYTimes } from './nytimes'
import { SimplyRecipes } from './simplyrecipes'
import { Skinnytaste } from './skinnytaste'

/**
 * Constructor type for scraper classes.
 */
type ScraperClass = {
  new (html: string, url: string, options?: ScraperOptions): AbstractScraper
  host(): string
}

/**
 * Scrapers with custom extraction logic.
 * Adding a new scraper only requires adding it to this list.
 */
const customScraperClasses = [
  AmericasTestKitchen,
  BBCGoodFood,
  Epicurious,
  SimplyRecipes,
  NYTimes,
  Skinnytaste,
] as const satisfies readonly ScraperClass[]

/**
 * Hosts that can rely on generic schema.org extraction
 * and do not need dedicated scraper classes.
 */
const SCHEMA_ORG_ONLY_HOSTS = [
  'allrecipes.com',
  'budgetbytes.com',
  'damndelicious.net',
  'eatingwell.com',
  'food.com',
  'halfbakedharvest.com',
  'marmiton.org',
  'recipetineats.com',
  'seriouseats.com',
] as const satisfies readonly string[]

function createSchemaOrgOnlyScraper(host: string): ScraperClass {
  return class extends AbstractScraper {
    static host() {
      return host
    }
  }
}

const schemaOrgOnlyScraperClasses = SCHEMA_ORG_ONLY_HOSTS.map((host) =>
  createSchemaOrgOnlyScraper(host),
)

/**
 * Optional host aliases.
 * Example: 'bbc.co.uk': BBCGoodFood
 */
const scraperAliases = {
  'bbc.co.uk': BBCGoodFood,
} as const satisfies Record<string, ScraperClass>

function buildScraperRegistry(
  classes: readonly ScraperClass[],
  aliases: Readonly<Record<string, ScraperClass>>,
): Record<string, ScraperClass> {
  const registry: Record<string, ScraperClass> = {}

  const registerHost = (
    host: string,
    scraper: ScraperClass,
    source: string,
  ) => {
    const existing = registry[host]

    if (existing && existing !== scraper) {
      throw new Error(`Duplicate scraper key '${host}' from ${source}.`)
    }

    registry[host] = scraper
  }

  for (const scraper of classes) {
    registerHost(scraper.host(), scraper, 'host()')
  }

  for (const [alias, scraper] of Object.entries(aliases)) {
    registerHost(alias, scraper, 'alias')
  }

  return registry
}

/**
 * A map of all scrapers keyed by host and aliases.
 */
export const scrapers = buildScraperRegistry(
  [...customScraperClasses, ...schemaOrgOnlyScraperClasses],
  scraperAliases,
)
