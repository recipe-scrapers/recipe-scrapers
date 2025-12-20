import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import z from 'zod'
import { AbstractScraper } from '@/abstract-scraper'
import { LogLevel } from '@/logger'
import { scrapers } from '@/scrapers/_index'
import type { RecipeObject } from '@/types/recipe.interface'

const DATA_DIR = './test-data'

async function getTestDataFiles() {
  // Use Bun.glob to find all .testhtml files
  const glob = new Bun.Glob('**/*.testhtml')

  // Group files by host (directory name)
  const hostGroups = new Map<string, { html: string[]; json: string[] }>()

  for await (const file of glob.scan(DATA_DIR)) {
    // The directory name is the host
    const { dir } = path.parse(file)
    const host = hostGroups.get(dir)
    const testHtmlPath = path.join(DATA_DIR, file)
    const testJsonPath = testHtmlPath.replace('.testhtml', '.json')

    const jsonFileExists = await Bun.file(testJsonPath).exists()

    if (!jsonFileExists) {
      console.warn(
        `Skipping ${testHtmlPath}: corresponding JSON file not found`,
      )
      continue
    }

    if (!host) {
      hostGroups.set(dir, { html: [testHtmlPath], json: [testJsonPath] })
    } else {
      host.html.push(testHtmlPath)
      host.json.push(testJsonPath)
    }
  }

  return hostGroups
}

function runTestSuite(host: string, htmlFiles: string[], jsonFiles: string[]) {
  const Scraper = scrapers[host]

  describe(`Scraper: ${host}`, async () => {
    it('should be defined', () => {
      expect(Scraper).toBeDefined()
    })

    it('should be an instance of AbstractScraper', () => {
      expect(new Scraper('', '')).toBeInstanceOf(AbstractScraper)
    })

    it('should have a valid host', () => {
      expect(Scraper.host()).toBe(host)
    })

    it('should have test data files', () => {
      expect(htmlFiles.length).toBeGreaterThan(0)
      expect(htmlFiles.length).toBe(jsonFiles.length)
    })

    for (let i = 0; i < htmlFiles.length; i++) {
      const htmlFile = htmlFiles[i]
      const jsonFile = jsonFiles[i]
      const { base: fileName } = path.parse(htmlFile)
      const htmlContent = await Bun.file(htmlFile).text()
      const expectedData: RecipeObject = await Bun.file(jsonFile).json()

      describe(fileName, () => {
        it('should correctly parse and validate the recipe', async () => {
          const scraper = new Scraper(htmlContent, host, {
            logLevel: LogLevel.WARN,
          })
          const data: RecipeObject = await scraper.toRecipeObject()
          expect(data).toEqual(expectedData)

          const parsedResult = await scraper.safeParse()

          if (!parsedResult.success) {
            console.error(z.prettifyError(parsedResult.error))
          }

          expect(parsedResult.success).toBe(true)

          if (parsedResult.success) {
            expect(parsedResult.data).toMatchObject(expectedData)
          }
        })
      })
    }
  })
}

const testDataFiles = await getTestDataFiles()

const onlyScraper = '' //'epicurious.com'

console.log(`Running tests for scraper: ${onlyScraper || 'all'}`)

for (const [host, { html, json }] of testDataFiles) {
  if (onlyScraper && host !== onlyScraper) continue
  runTestSuite(host, html, json)
}
