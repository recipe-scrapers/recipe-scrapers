import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { AbstractScraper } from '@/abstract-scraper'

import { loadTestFixtureCatalog } from './test-fixture-catalog'

class PrimaryScraper extends AbstractScraper {
  static override host() {
    return 'primary.test'
  }
}

const registry = {
  'primary.test': PrimaryScraper,
  'alias.test': PrimaryScraper,
}

let dataDirectory = ''

beforeEach(async () => {
  dataDirectory = await mkdtemp(path.join(tmpdir(), 'recipe-scrapers-fixtures-'))
})

afterEach(async () => {
  await rm(dataDirectory, { recursive: true, force: true })
})

async function writeFixture(name: string, expected: unknown) {
  const hostDirectory = path.join(dataDirectory, 'primary.test')
  await mkdir(hostDirectory, { recursive: true })
  await Promise.all([
    writeFile(path.join(hostDirectory, `${name}.testhtml`), '<html></html>'),
    writeFile(path.join(hostDirectory, `${name}.json`), JSON.stringify(expected)),
  ])
}

describe('test fixture catalog', () => {
  it('loads primary fixtures, aliases, and fixture-driven options', async () => {
    await Promise.all([
      writeFixture('plain', { ingredients: [] }),
      writeFixture('parsed', {
        ingredients: [{ name: null, items: [{ value: '1 cup flour', parsed: {} }] }],
      }),
      writeFixture('notes', { ingredients: [], notes: [] }),
    ])

    const [supportedHost] = await loadTestFixtureCatalog(registry, dataDirectory)

    expect(supportedHost).toMatchObject({
      host: 'primary.test',
      aliases: ['alias.test'],
    })
    expect(supportedHost?.fixtures.map(({ name, options }) => ({ name, options }))).toEqual([
      {
        name: 'notes.testhtml',
        options: { parseIngredients: false, parseNotes: true },
      },
      {
        name: 'parsed.testhtml',
        options: { parseIngredients: true, parseNotes: false },
      },
      {
        name: 'plain.testhtml',
        options: { parseIngredients: false, parseNotes: false },
      },
    ])
  })

  it('requires fixtures for every primary host', async () => {
    await expect(loadTestFixtureCatalog(registry, dataDirectory)).rejects.toThrow(
      "Primary host 'primary.test' requires at least one fixture pair.",
    )
  })

  it('rejects incomplete fixture pairs', async () => {
    const hostDirectory = path.join(dataDirectory, 'primary.test')
    await mkdir(hostDirectory)
    await writeFile(path.join(hostDirectory, 'recipe.testhtml'), '<html></html>')

    await expect(loadTestFixtureCatalog(registry, dataDirectory)).rejects.toThrow(
      `Fixture '${path.join('primary.test', 'recipe.testhtml')}' has no corresponding JSON file.`,
    )
  })

  it('rejects JSON fixtures without HTML', async () => {
    const hostDirectory = path.join(dataDirectory, 'primary.test')
    await mkdir(hostDirectory)
    await writeFile(path.join(hostDirectory, 'recipe.json'), '{"ingredients":[]}')

    await expect(loadTestFixtureCatalog(registry, dataDirectory)).rejects.toThrow(
      `Fixture '${path.join('primary.test', 'recipe.json')}' has no corresponding HTML file.`,
    )
  })

  it('rejects fixtures registered under an alias', async () => {
    const hostDirectory = path.join(dataDirectory, 'alias.test')
    await mkdir(hostDirectory)
    await Promise.all([
      writeFile(path.join(hostDirectory, 'recipe.testhtml'), '<html></html>'),
      writeFile(path.join(hostDirectory, 'recipe.json'), '{"ingredients":[]}'),
    ])

    await expect(loadTestFixtureCatalog(registry, dataDirectory)).rejects.toThrow(
      "Fixture host 'alias.test' is not a registered primary host.",
    )
  })
})
