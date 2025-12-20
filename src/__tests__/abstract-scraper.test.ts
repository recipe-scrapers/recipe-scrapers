import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { AbstractScraper } from '@/abstract-scraper'
import { NotImplementedException } from '@/exceptions'
import { Logger } from '@/logger'
import type { RecipeFields } from '@/types/recipe.interface'
import { stringsToIngredients } from '@/utils/ingredients'
import { stringsToInstructions } from '@/utils/instructions'

class DummyScraper extends AbstractScraper {
  // implement required static host
  static host(): string {
    return 'dummy.com'
  }
  // no site-specific extractors
  extractors = {}
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
    it('returns empty list when linksEnabled is false', () => {
      scraper = new DummyScraper(html, 'url', { linksEnabled: false })
      expect(scraper.links()).toEqual([])
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

  // Provide no real HTML parsing
  extractors = {}
  private data: Partial<Record<keyof RecipeFields, unknown>>
  constructor(data: Partial<Record<keyof RecipeFields, unknown>>) {
    // html, url and options are unused because we override methods
    super('', '', { linksEnabled: true })
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
      expect(
        result.error.issues.some((issue) => issue.path[0] === 'image'),
      ).toBe(true)
    }
  })
})
