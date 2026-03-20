import { AbstractScraper } from '@/abstract-scraper'
import type { ScraperOptions } from '@/types/scraper.interface'
import { AmericasTestKitchen } from './americastestkitchen'
import { BBCGoodFood } from './bbcgoodfood'
import { BongEats } from './bongeats'
import { Epicurious } from './epicurious'
import { InspiredTaste } from './inspiredtaste'
import { MyPlate } from './myplate'
import { NYTimes } from './nytimes'
import { OnceUponAChef } from './onceuponachef'
import { SimplyRecipes } from './simplyrecipes'
import { Skinnytaste } from './skinnytaste'
import { TheCleverCarrot } from './theclevercarrot'

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
  BongEats,
  Epicurious,
  InspiredTaste,
  MyPlate,
  SimplyRecipes,
  NYTimes,
  OnceUponAChef,
  Skinnytaste,
  TheCleverCarrot,
] as const satisfies readonly ScraperClass[]

/**
 * Hosts that can rely on generic schema.org extraction
 * and do not need dedicated scraper classes.
 */
const SCHEMA_ORG_ONLY_HOSTS = [
  'addapinch.com',
  'afarmgirlsdabbles.com',
  'aflavorjournal.com',
  'akispetretzikis.com',
  'altonbrown.com',
  'allrecipes.com',
  'archanaskitchen.com',
  'bestrecipes.com.au',
  'blueapron.com',
  'bonappetit.com',
  'bowlofdelicious.com',
  'brasspine.com',
  'budgetbytes.com',
  'damndelicious.net',
  'eatingwell.com',
  'chefjeanpierre.com',
  'chewoutloud.com',
  'familyfoodonthetable.com',
  'food.com',
  'halfbakedharvest.com',
  'howtofeedaloon.com',
  'inbloombakery.com',
  'indianhealthyrecipes.com',
  'joyfoodsunshine.com',
  'lecremedelacrumb.com',
  'maangchi.com',
  'marmiton.org',
  'marthastewart.com',
  'natashaskitchen.com',
  'noracooks.com',
  'norecipes.com',
  'organicallyaddison.com',
  'recipetineats.com',
  'savorynothings.com',
  'seriouseats.com',
  'simplegreensmoothies.com',
  'sunbasket.com',
  'sweetcsdesigns.com',
  'tastesbetterfromscratch.com',
  'tasty.co',
  'tastyoven.com',
  'thebigmansworld.com',
  'thecookierookie.com',
  'themediterraneandish.com',
  'therecipecritic.com',
  'unsophisticook.com',
  'wellplated.com',
  'zestfulkitchen.com',
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
