import { beforeEach, describe, expect, it } from 'bun:test'

import { load } from 'cheerio'

import {
  NotImplementedException,
  UnsupportedFieldException,
} from '@/exceptions'
import { stringsToIngredients } from '@/utils/ingredients'
import { stringsToInstructions } from '@/utils/instructions'

import { ExtractorPlugin } from '../abstract-extractor-plugin'
import type { RecipeFields } from '../types/recipe.interface'

class MockExtractorPlugin extends ExtractorPlugin {
  name = 'MockExtractorPlugin'
  priority = 100

  private supportedFields: Set<keyof RecipeFields>

  constructor(supportedFields: (keyof RecipeFields)[] = []) {
    const $ = load('<html><body></body></html>')
    super($)
    this.supportedFields = new Set(supportedFields)
  }

  supports(field: keyof RecipeFields): boolean {
    return this.supportedFields.has(field)
  }

  extract<Key extends keyof RecipeFields>(field: Key): RecipeFields[Key] {
    if (!this.supports(field)) {
      throw new UnsupportedFieldException(field)
    }

    // Mock extraction logic
    switch (field) {
      case 'title':
        return 'Mock Recipe Title' as RecipeFields[Key]
      case 'description':
        return 'Mock Recipe Description' as RecipeFields[Key]
      case 'ingredients':
        return stringsToIngredients([
          'ingredient 1',
          'ingredient 2',
        ]) as RecipeFields[Key]
      case 'instructions':
        return stringsToInstructions(['step 1', 'step 2']) as RecipeFields[Key]
      case 'prepTime':
        return 15 as RecipeFields[Key]
      case 'cookTime':
        return 30 as RecipeFields[Key]
      case 'totalTime':
        return 45 as RecipeFields[Key]
      case 'yields':
        return '4 servings' as RecipeFields[Key]
      default:
        throw new NotImplementedException(field)
    }
  }
}

class AsyncMockExtractorPlugin extends ExtractorPlugin {
  name = 'AsyncMockExtractorPlugin'
  priority = 100

  constructor() {
    const $ = load('<html><body></body></html>')
    super($)
  }

  supports(field: keyof RecipeFields): boolean {
    return ['title', 'description'].includes(field)
  }

  async extract<Key extends keyof RecipeFields>(
    field: Key,
  ): Promise<RecipeFields[Key]> {
    await new Promise((resolve) => setTimeout(resolve, 10))

    if (!this.supports(field)) {
      throw new UnsupportedFieldException(field)
    }

    switch (field) {
      case 'title':
        return 'Async Recipe Title' as RecipeFields[Key]
      case 'description':
        return 'Async Recipe Description' as RecipeFields[Key]
      default:
        throw new NotImplementedException(field)
    }
  }
}

class ThrowingExtractorPlugin extends ExtractorPlugin {
  name = 'ThrowingExtractorPlugin'
  priority = 100

  constructor() {
    const $ = load('<html><body></body></html>')
    super($)
  }

  supports(_field: keyof RecipeFields): boolean {
    return true
  }

  extract<Key extends keyof RecipeFields>(field: Key): RecipeFields[Key] {
    throw new Error(`Extraction failed for field: ${String(field)}`)
  }
}

describe('ExtractorPlugin', () => {
  let plugin: MockExtractorPlugin

  beforeEach(() => {
    plugin = new MockExtractorPlugin([
      'title',
      'description',
      'ingredients',
      'prepTime',
    ])
  })

  describe('inheritance', () => {
    it('should extend AbstractPlugin', () => {
      expect(plugin).toBeInstanceOf(ExtractorPlugin)
    })

    it('should have access to cheerio instance from parent', () => {
      expect(plugin.$).toBeDefined()
      expect(typeof plugin.$).toBe('function')
    })
  })

  describe('supports method', () => {
    it('should return true for supported fields', () => {
      expect(plugin.supports('title')).toBe(true)
      expect(plugin.supports('description')).toBe(true)
      expect(plugin.supports('ingredients')).toBe(true)
      expect(plugin.supports('prepTime')).toBe(true)
    })

    it('should return false for unsupported fields', () => {
      expect(plugin.supports('cookTime')).toBe(false)
      expect(plugin.supports('totalTime')).toBe(false)
      expect(plugin.supports('yields')).toBe(false)
      expect(plugin.supports('author')).toBe(false)
    })

    it('should handle empty supported fields', () => {
      const emptyPlugin = new MockExtractorPlugin([])
      expect(emptyPlugin.supports('title')).toBe(false)
      expect(emptyPlugin.supports('description')).toBe(false)
    })

    it('should handle all fields as supported', () => {
      const allFieldsPlugin = new MockExtractorPlugin([
        'title',
        'description',
        'ingredients',
        'instructions',
        'prepTime',
        'cookTime',
        'totalTime',
        'yields',
      ])

      expect(allFieldsPlugin.supports('title')).toBe(true)
      expect(allFieldsPlugin.supports('cookTime')).toBe(true)
      expect(allFieldsPlugin.supports('yields')).toBe(true)
    })
  })

  describe('extract method', () => {
    it('should extract supported fields', () => {
      expect(plugin.extract('title')).toBe('Mock Recipe Title')
      expect(plugin.extract('description')).toBe('Mock Recipe Description')
      expect(plugin.extract('prepTime')).toBe(15)
      const ingredients = plugin.extract('ingredients')
      expect(ingredients).toEqual(
        stringsToIngredients(['ingredient 1', 'ingredient 2']),
      )
    })

    it('should throw error for unsupported fields', () => {
      expect(() => plugin.extract('cookTime')).toThrow(
        'Extraction not supported for field: cookTime',
      )
      expect(() => plugin.extract('totalTime')).toThrow(
        'Extraction not supported for field: totalTime',
      )
    })
  })

  describe('async extraction', () => {
    let asyncPlugin: AsyncMockExtractorPlugin

    beforeEach(() => {
      asyncPlugin = new AsyncMockExtractorPlugin()
    })

    it('should handle async extraction', async () => {
      const title = await asyncPlugin.extract('title')
      expect(title).toBe('Async Recipe Title')
      const description = await asyncPlugin.extract('description')
      expect(description).toBe('Async Recipe Description')
    })

    it('should throw error for unsupported fields in async mode', async () => {
      await expect(asyncPlugin.extract('cookTime')).rejects.toThrow(
        'Extraction not supported for field: cookTime',
      )
    })
  })

  describe('error handling', () => {
    let throwingPlugin: ThrowingExtractorPlugin

    beforeEach(() => {
      throwingPlugin = new ThrowingExtractorPlugin()
    })

    it('should propagate extraction errors', () => {
      expect(() => throwingPlugin.extract('title')).toThrow(
        'Extraction failed for field: title',
      )
      expect(() => throwingPlugin.extract('description')).toThrow(
        'Extraction failed for field: description',
      )
    })
  })

  describe('edge cases', () => {
    it('should throw on undefined extractor', () => {
      const plugin = new MockExtractorPlugin(['author'])
      expect(() => plugin.extract('author')).toThrow(
        'Method should be implemented: author',
      )
    })
  })
})
