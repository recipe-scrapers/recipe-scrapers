import path from 'node:path'

import { z } from 'zod'

import type { AbstractScraper } from '@/abstract-scraper'
import type { RecipeObject } from '@/types/recipe.interface'
import type { ScraperOptions } from '@/types/scraper.interface'

type ScraperClass = {
  new (html: string, url: string, options?: ScraperOptions): AbstractScraper
  host(): string
  schemaOrgOnly?: boolean
}

type RecipeFixture = Omit<RecipeObject, 'schemaVersion'>

export type TestFixture = {
  name: string
  html: string
  expected: RecipeFixture
  options: Required<Pick<ScraperOptions, 'parseIngredients' | 'parseNotes'>> & FixtureOptions
}

export type SupportedHostTestFixtures = {
  host: string
  aliases: string[]
  scraperClass: ScraperClass
  fixtures: TestFixture[]
}

export type TestFixtureCatalog = SupportedHostTestFixtures[]

/**
 * Caller options a fixture can declare in a sibling `<name>.options.json`,
 * for pages that need a consumer-provided fallback to parse. Only string
 * fallbacks are supported because the file is plain JSON.
 */
const FixtureOptionsSchema = z.strictObject({
  fallbackAuthor: z.string().optional(),
  fallbackDescription: z.string().optional(),
  fallbackImage: z.string().optional(),
  fallbackYield: z.string().optional(),
})

type FixtureOptions = z.infer<typeof FixtureOptionsSchema>

const OPTIONS_SUFFIX = '.options.json'

async function readFixtureOptions(optionsPath: string): Promise<FixtureOptions> {
  const file = Bun.file(optionsPath)

  if (!(await file.exists())) return {}

  const result = FixtureOptionsSchema.safeParse(await file.json())

  if (!result.success) {
    throw new Error(`Invalid fixture options '${optionsPath}': ${z.prettifyError(result.error)}`)
  }

  return result.data
}

function inferFixtureOptions(fixture: RecipeFixture): TestFixture['options'] {
  return {
    parseIngredients: fixture.ingredients.some((group) =>
      group.items.some((item) => 'parsed' in item),
    ),
    parseNotes: Object.hasOwn(fixture, 'notes'),
  }
}

function getFixtureHost(file: string): string {
  const [host] = file.split(/[\\/]/)

  if (!host) throw new Error(`Could not determine fixture host from '${file}'.`)
  return host
}

function getSupportedHosts(
  registry: Readonly<Record<string, ScraperClass>>,
): Map<string, SupportedHostTestFixtures> {
  const supportedHosts = new Map<string, SupportedHostTestFixtures>()

  for (const [registeredHost, scraperClass] of Object.entries(registry)) {
    if (registeredHost !== scraperClass.host()) continue

    supportedHosts.set(registeredHost, {
      host: registeredHost,
      aliases: [],
      scraperClass,
      fixtures: [],
    })
  }

  for (const [registeredHost, scraperClass] of Object.entries(registry)) {
    const primaryHost = scraperClass.host()

    if (registeredHost === primaryHost) continue

    const supportedHost = supportedHosts.get(primaryHost)

    if (!supportedHost || supportedHost.scraperClass !== scraperClass) {
      throw new Error(
        `Alias '${registeredHost}' does not resolve to registered primary host '${primaryHost}'.`,
      )
    }

    supportedHost.aliases.push(registeredHost)
  }

  return supportedHosts
}

/**
 * Loads and validates the fixtures for every primary host in a scraper registry.
 * Registry keys that differ from their scraper's `host()` are treated as aliases
 * and reuse the primary host's fixtures.
 */
export async function loadTestFixtureCatalog(
  registry: Readonly<Record<string, ScraperClass>>,
  dataDirectory: string,
): Promise<TestFixtureCatalog> {
  const supportedHosts = getSupportedHosts(registry)
  const [htmlFiles, allJsonFiles] = await Promise.all([
    Array.fromAsync(new Bun.Glob('**/*.testhtml').scan(dataDirectory)),
    Array.fromAsync(new Bun.Glob('**/*.json').scan(dataDirectory)),
  ])
  const jsonFiles = allJsonFiles.filter((file) => !file.endsWith(OPTIONS_SUFFIX))
  const htmlFileSet = new Set(htmlFiles)
  const jsonFileSet = new Set(jsonFiles)

  for (const optionsFile of allJsonFiles.filter((file) => file.endsWith(OPTIONS_SUFFIX))) {
    if (!jsonFileSet.has(optionsFile.replace(OPTIONS_SUFFIX, '.json'))) {
      throw new Error(`Fixture options '${optionsFile}' have no corresponding fixture.`)
    }
  }

  for (const jsonFile of jsonFiles) {
    const htmlFile = jsonFile.replace(/\.json$/, '.testhtml')

    if (!htmlFileSet.has(htmlFile)) {
      throw new Error(`Fixture '${jsonFile}' has no corresponding HTML file.`)
    }
  }

  for (const htmlFile of htmlFiles.sort()) {
    const jsonFile = htmlFile.replace(/\.testhtml$/, '.json')

    if (!jsonFileSet.has(jsonFile)) {
      throw new Error(`Fixture '${htmlFile}' has no corresponding JSON file.`)
    }

    const host = getFixtureHost(htmlFile)
    const supportedHost = supportedHosts.get(host)

    if (!supportedHost) {
      throw new Error(`Fixture host '${host}' is not a registered primary host.`)
    }

    const htmlPath = path.join(dataDirectory, htmlFile)
    const jsonPath = path.join(dataDirectory, jsonFile)
    const expected: RecipeFixture = await Bun.file(jsonPath).json()

    supportedHost.fixtures.push({
      name: path.basename(htmlFile),
      html: await Bun.file(htmlPath).text(),
      expected,
      options: {
        ...inferFixtureOptions(expected),
        ...(await readFixtureOptions(jsonPath.replace(/\.json$/, OPTIONS_SUFFIX))),
      },
    })
  }

  const catalog = [...supportedHosts.values()].sort((left, right) =>
    left.host.localeCompare(right.host),
  )

  for (const supportedHost of catalog) {
    supportedHost.aliases.sort()

    if (supportedHost.fixtures.length === 0 && supportedHost.scraperClass.schemaOrgOnly !== true) {
      throw new Error(`Primary host '${supportedHost.host}' requires at least one fixture pair.`)
    }
  }

  return catalog
}
