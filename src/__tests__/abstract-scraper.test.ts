import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import { AbstractScraper } from '@/abstract-scraper'
import {
  ExtractionRuntimeException,
  ExtractorNotFoundException,
  NotImplementedException,
  ValidationException,
} from '@/exceptions'
import { Logger } from '@/logger'
import type { RecipeFields, RecipeObject } from '@/types/recipe.interface'
import type { ScraperOptions } from '@/types/scraper.interface'
import { stringsToIngredients } from '@/utils/ingredients'
import { stringsToInstructions } from '@/utils/instructions'

class DummyScraper extends AbstractScraper {
  // implement required static host
  static host(): string {
    return 'dummy.com'
  }
}

describe('AbstractScraper utility methods', () => {
  let scraper: DummyScraper

  describe('static host()', () => {
    it('throws by default on base class', () => {
      expect(() => AbstractScraper.host()).toThrow(NotImplementedException)
    })

    it('returns host for subclass', () => {
      expect(DummyScraper.host()).toBe('dummy.com')
    })
  })

  describe('canonicalUrl()', () => {
    it('returns absolute canonical URL when provided', () => {
      const html = '<link rel="canonical" href="/foo/bar"/>'
      scraper = new DummyScraper(html, 'http://example.com/page', {})
      expect(scraper.canonicalUrl()).toBe('http://example.com/foo/bar')
    })

    it('returns base URL when no canonical link', () => {
      const html = '<html></html>'
      scraper = new DummyScraper(html, 'https://site.org/path?x=1', {})
      expect(scraper.canonicalUrl()).toBe('https://site.org/path?x=1')
    })

    it('prefixes URL with https when missing protocol', () => {
      const html = ''
      scraper = new DummyScraper(html, 'site.org/abc', {})
      expect(scraper.canonicalUrl()).toBe('https://site.org/abc')
    })
  })

  describe('language()', () => {
    let warnSpy: ReturnType<typeof spyOn>

    beforeEach(() => {
      warnSpy = spyOn(Logger.prototype, 'warn').mockImplementation(() => {})
    })
    afterEach(() => {
      warnSpy.mockRestore()
    })

    it('reads html lang attribute', () => {
      const html = '<html lang="fr"><body></body></html>'
      scraper = new DummyScraper(html, 'url', {})
      expect(scraper.language()).toBe('fr')
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('falls back to meta http-equiv content-language', () => {
      const html =
        '<html><head>' +
        '<meta http-equiv="content-language" content="de, en"/>' +
        '</head></html>'
      scraper = new DummyScraper(html, 'url', {})
      expect(scraper.language()).toBe('de')
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('defaults to "en" and logs warning when none found', () => {
      scraper = new DummyScraper('<html></html>', 'url', {})
      expect(scraper.language()).toBe('en')
      expect(warnSpy).toHaveBeenCalledWith('Could not determine language')
    })
  })

  describe('links()', () => {
    const html = `
      <a href="http://foo.com/page">Foo</a>
      <a href="/local">Local</a>
      <a>No href</a>
    `
    it('returns undefined when linksEnabled is false', () => {
      scraper = new DummyScraper(html, 'url', { linksEnabled: false })
      expect(scraper.links()).toBeUndefined()
    })

    it('returns only absolute links when linksEnabled is true', () => {
      scraper = new DummyScraper(html, 'url', { linksEnabled: true })
      const links = scraper.links()
      expect(links).toEqual([{ href: 'http://foo.com/page', text: 'Foo' }])
    })
  })
})

// Test subclass overriding extract, canonicalUrl, language, links, and host
class TestScraper extends AbstractScraper {
  static host(): string {
    return 'host.test'
  }

  private data: Partial<Record<keyof RecipeFields, unknown>>
  constructor(
    data: Partial<Record<keyof RecipeFields, unknown>>,
    options: ScraperOptions = {},
  ) {
    // html, url and options are unused because we override methods
    super('', '', { linksEnabled: true, ...options })
    this.data = data
  }

  // Return mocked values for every field
  async extract<Key extends keyof RecipeFields>(
    field: Key,
  ): Promise<RecipeFields[Key]> {
    return this.data[field] as RecipeFields[Key]
  }

  override canonicalUrl(): string {
    return this.data.canonicalUrl as string
  }
  override language(): string {
    return this.data.language as string
  }
  override links(): RecipeFields['links'] {
    return this.data.links as RecipeFields['links']
  }
}

class ThrowingScraper extends AbstractScraper {
  static host(): string {
    return 'throw.test'
  }

  override async extract<Key extends keyof RecipeFields>(
    _field: Key,
  ): Promise<RecipeFields[Key]> {
    throw new Error('Extraction exploded')
  }
}

class MissingFieldScraper extends AbstractScraper {
  static host(): string {
    return 'missing.test'
  }

  override async extract<Key extends keyof RecipeFields>(
    _field: Key,
  ): Promise<RecipeFields[Key]> {
    throw new ExtractorNotFoundException('author')
  }
}

class RuntimeErrorScraper extends AbstractScraper {
  static host(): string {
    return 'runtime.test'
  }

  override async extract<Key extends keyof RecipeFields>(
    _field: Key,
  ): Promise<RecipeFields[Key]> {
    throw new ExtractionRuntimeException(
      'totalTime',
      'plugin "SchemaOrgPlugin"',
      new RangeError('invalid duration: 35 minutes'),
    )
  }
}

describe('AbstractScraper.toRecipeObject', () => {
  const createMockValues = (): Partial<
    Record<keyof RecipeFields, unknown>
  > => ({
    siteName: 'site',
    author: 'auth',
    title: 'ttl',
    image: 'https://host.test/image.jpg',
    description: 'desc',
    yields: '4 servings',
    totalTime: 30,
    cookTime: 10,
    prepTime: 20,
    cookingMethod: 'bake',
    ratings: 4.2,
    ratingsCount: 100,
    category: new Set(['cat1', 'cat2']),
    cuisine: new Set(['cui']),
    dietaryRestrictions: new Set(['veg']),
    equipment: new Set(['pan']),
    ingredients: stringsToIngredients(['ing1', 'ing2']),
    instructions: stringsToInstructions(['step1', 'step2']),
    keywords: new Set(['kw1']),
    nutrients: new Map([['cal', '200kcal']]),
    reviews: new Map([['rev1', 'Good']]),
    canonicalUrl: 'https://host.test/recipe',
    language: 'en-US',
    links: [{ href: 'https://host.test/link', text: 'LinkText' }],
  })

  it('returns a fully serialized RecipeObject', async () => {
    const scraper = new TestScraper(createMockValues())
    const result = await scraper.toRecipeObject()

    // Basic scalar fields
    const expectedRest = {
      host: 'host.test',
      siteName: 'site',
      author: 'auth',
      title: 'ttl',
      image: 'https://host.test/image.jpg',
      canonicalUrl: 'https://host.test/recipe',
      language: 'en-US',
      links: [{ href: 'https://host.test/link', text: 'LinkText' }],
      description: 'desc',
      yields: '4 servings',
      totalTime: 30,
      cookTime: 10,
      prepTime: 20,
      cookingMethod: 'bake',
      ratings: 4.2,
      ratingsCount: 100,
    }

    expect(result).toMatchObject({
      ...expectedRest,
      category: ['cat1', 'cat2'],
      cuisine: ['cui'],
      dietaryRestrictions: ['veg'],
      equipment: ['pan'],
      ingredients: [
        {
          name: null,
          items: [{ value: 'ing1' }, { value: 'ing2' }],
        },
      ],
      instructions: [
        {
          name: null,
          items: [{ value: 'step1' }, { value: 'step2' }],
        },
      ],
      keywords: ['kw1'],
      nutrients: { cal: '200kcal' },
      reviews: { rev1: 'Good' },
    })
  })

  it('validates and normalizes recipe data via parse()', async () => {
    const scraper = new TestScraper(createMockValues())
    const parsed = await scraper.parse()

    expect(parsed.host).toBe('host.test')
    expect(parsed.canonicalUrl).toBe('https://host.test/recipe')
    expect(parsed.image).toBe('https://host.test/image.jpg')
    expect(parsed.links).toEqual([
      { href: 'https://host.test/link', text: 'LinkText' },
    ])
  })

  it('returns a failed safeParse result when validation fails', async () => {
    const scraper = new TestScraper({
      ...createMockValues(),
      image: 'invalid-url',
    })

    const result = await scraper.safeParse()
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('validation')
      expect(result.error.code).toBe('validation_failed')
      expect(
        result.error.issues.some((issue) => issue.path?.[0] === 'image'),
      ).toBe(true)
    }
  })

  it('throws ValidationException from parse() on validation failure', () => {
    const scraper = new TestScraper({
      ...createMockValues(),
      image: 'invalid-url',
    })

    expect(scraper.parse()).rejects.toThrow(ValidationException)
  })

  it('returns a failed safeParse result when extraction fails', async () => {
    const scraper = new ThrowingScraper('', 'https://throw.test')
    const result = await scraper.safeParse()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('extraction')
      expect(result.error.code).toBe('extraction_failed')
      expect(result.error.issues[0]?.message).toBe('Extraction exploded')
      expect(result.error.cause).toBeInstanceOf(Error)
    }
  })

  it('returns extractor_not_found metadata when required field is missing', async () => {
    const scraper = new MissingFieldScraper('', 'https://missing.test')
    const result = await scraper.safeParse()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('extraction')
      expect(result.error.code).toBe('extractor_not_found')
      expect(result.error.context?.field).toBe('author')
      expect(result.error.issues[0]?.path?.[0]).toBe('author')
    }
  })

  it('returns extraction_runtime_error metadata with source context', async () => {
    const scraper = new RuntimeErrorScraper('', 'https://runtime.test')
    const result = await scraper.safeParse()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('extraction')
      expect(result.error.code).toBe('extraction_runtime_error')
      expect(result.error.context?.field).toBe('totalTime')
      expect(result.error.context?.source).toBe('plugin "SchemaOrgPlugin"')
      expect(result.error.issues[0]?.path?.[0]).toBe('totalTime')
    }
  })

  it('parse() still throws extraction errors before validation', () => {
    const scraper = new ThrowingScraper('', 'https://throw.test')
    expect(scraper.parse()).rejects.toThrow('Extraction exploded')
  })

  it('uses schema when provided in options', async () => {
    const schema: StandardSchemaV1<unknown, RecipeObject> = {
      '~standard': {
        version: 1,
        vendor: 'always-fail',
        validate() {
          return {
            issues: [{ message: 'Forced failure', path: ['title'] }],
          }
        },
      },
    }

    const scraper = new TestScraper(createMockValues(), {
      schema,
    })

    const result = await scraper.safeParse()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('validation')
      expect(result.error.code).toBe('validation_failed')
      expect(result.error.issues[0]?.message).toBe('Forced failure')
    }
  })
})
