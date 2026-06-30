import type { SafeParseResult } from './schema-adapter'
import { scrapers } from './scrapers/_index'
import { GenericScraper } from './scrapers/generic'
import type { RecipeObject } from './types/recipe.interface'
import type { ScraperOptions } from './types/scraper.interface'
import { getHostName } from './utils'

export * from '@/schemas/recipe.schema'
export * from '@/types/recipe.interface'
export * from '@/types/scraper.interface'
export * from './abstract-extractor-plugin'
export * from './abstract-postprocessor-plugin'
export * from './logger'
export * from './schema-adapter'
export * from './utils/parse-yields'
export { GenericScraper, scrapers }

export interface GetScraperOptions {
  /**
   * Return a generic schema.org scraper for unsupported hosts.
   * @default false
   */
  wildMode?: boolean
}

interface BaseScrapeRecipeOptions extends ScraperOptions {
  /**
   * Allow parsing unsupported hosts with GenericScraper fallback.
   * @default true
   */
  wildMode?: boolean
}

export interface ScrapeRecipeOptions extends BaseScrapeRecipeOptions {
  /**
   * Return a safe-parse result instead of throwing.
   * @default false
   */
  safeParse?: false
}

export interface ScrapeRecipeSafeParseOptions extends BaseScrapeRecipeOptions {
  /**
   * Return a safe-parse result instead of throwing.
   */
  safeParse: true
}

/**
 * Returns a scraper class for the given URL, if implemented.
 * Returns a GenericScraper if the host is not supported and `wildMode` is true.
 * Throws an error if the host is not supported and `wildMode` is false.
 */
export function getScraper(
  url: string,
  { wildMode = false }: GetScraperOptions = {},
) {
  const hostName = getHostName(url)
  const scraper = scrapers[hostName]

  if (scraper) {
    return scraper
  }

  if (wildMode) {
    return GenericScraper
  }

  throw new Error(
    `The website '${hostName}' is not currently supported.\nIf you want to help add support, please open an issue!`,
  )
}

/**
 * Parse a recipe from HTML and URL in one call.
 * Falls back to generic schema.org extraction by default.
 */
export function scrapeRecipe(
  html: string,
  url: string,
  options: ScrapeRecipeSafeParseOptions,
): Promise<SafeParseResult<RecipeObject>>
export function scrapeRecipe(
  html: string,
  url: string,
  options?: ScrapeRecipeOptions,
): Promise<RecipeObject>
export async function scrapeRecipe(
  html: string,
  url: string,
  {
    safeParse = false,
    wildMode = true,
    ...scraperOptions
  }: ScrapeRecipeOptions | ScrapeRecipeSafeParseOptions = {},
): Promise<RecipeObject | SafeParseResult<RecipeObject>> {
  const Scraper = getScraper(url, { wildMode })
  const scraper = new Scraper(html, url, scraperOptions)
  return safeParse ? scraper.safeParse() : scraper.parse()
}
