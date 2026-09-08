import { describe, expect, it, spyOn } from 'bun:test'

import { load } from 'cheerio'

import type { ExtractorPlugin } from '../abstract-extractor-plugin'
import {
  ExtractionFailedException,
  ExtractionRuntimeException,
  ExtractorNotFoundException,
} from '../exceptions'
import { RecipeExtractor } from '../recipe-extractor'
import type { RecipeFields } from '../types/recipe.interface'

describe('RecipeExtractor', () => {
  const scraperName = 'TestScraper'

  it('uses a single plugin to extract a field', async () => {
    const pluginA = {
      name: 'PluginA',
      priority: 10,
      $: load('<html><body></body></html>'),
      supports: (field: keyof RecipeFields) => field === 'title',
      extract: async (_: keyof RecipeFields) => 'PluginA-Name',
    } as ExtractorPlugin

    const extractor = new RecipeExtractor([pluginA], scraperName)
    const result = await extractor.extract('title')
    expect(result).toBe('PluginA-Name')
  })

  it('respects plugin priority (higher first)', async () => {
    // lower priority returns L1, higher priority returns H1
    const low = {
      name: 'Low',
      priority: 1,
      $: load('<html><body></body></html>'),
      supports: () => true,
      extract: () => 'L1',
    } as ExtractorPlugin
    const high = {
      name: 'High',
      priority: 100,
      $: load('<html><body></body></html>'),
      supports: () => true,
      extract: () => 'H1',
    } as ExtractorPlugin

    const spyLow = spyOn(low, 'extract')
    const spyHigh = spyOn(high, 'extract')

    const extractor = new RecipeExtractor([low, high], scraperName)
    const result = await extractor.extract('title')
    expect(result).toBe('H1')
    expect(spyHigh).toHaveBeenCalled()
    expect(spyLow).not.toHaveBeenCalled()
  })

  it('uses site-specific extractor when provided', async () => {
    const plugin = {
      name: 'X',
      priority: 0,
      $: load('<html><body></body></html>'),
      supports: () => false,
      extract: () => 'X',
    } as ExtractorPlugin

    const extractor = new RecipeExtractor([plugin], scraperName)
    const siteValue = await extractor.extract('title', (prev) => {
      expect(prev).toBeUndefined()
      return 'SiteName'
    })
    expect(siteValue).toBe('SiteName')
  })

  it('chains plugin result into site-specific extractor', async () => {
    const plugin = {
      name: 'P',
      priority: 0,
      $: load('<html><body></body></html>'),
      supports: () => true,
      extract: () => 'FromPlugin',
    } as ExtractorPlugin

    const extractor = new RecipeExtractor([plugin], scraperName)
    const final = await extractor.extract('title', (prev) => {
      expect(prev).toBe('FromPlugin')
      return `${prev}-Site`
    })
    expect(final).toBe('FromPlugin-Site')
  })

  it('throws ExtractorNotFoundException when no plugin or extractor applies', async () => {
    const plugin = {
      name: 'None',
      priority: 0,
      $: load('<html><body></body></html>'),
      supports: () => false,
      extract: () => 'X',
    } as ExtractorPlugin

    const extractor = new RecipeExtractor([plugin], scraperName)
    await expect(extractor.extract('title')).rejects.toThrow(ExtractorNotFoundException)
    await expect(extractor.extract('title')).rejects.toThrow('No extractor found for field: title')
  })

  it('continues to lower-priority plugins for recoverable extraction failures', async () => {
    const high = {
      name: 'High',
      priority: 100,
      $: load('<html><body></body></html>'),
      supports: () => true,
      extract: () => {
        throw new ExtractionFailedException('title')
      },
    } as ExtractorPlugin

    const low = {
      name: 'Low',
      priority: 1,
      $: load('<html><body></body></html>'),
      supports: () => true,
      extract: () => 'Recovered title',
    } as ExtractorPlugin

    const extractor = new RecipeExtractor([low, high], scraperName)
    const result = await extractor.extract('title')

    expect(result).toBe('Recovered title')
  })

  it('throws ExtractionRuntimeException for unexpected plugin errors', () => {
    const plugin = {
      name: 'SchemaOrgPlugin',
      priority: 100,
      $: load('<html><body></body></html>'),
      supports: (field: keyof RecipeFields) => field === 'totalTime',
      extract: () => {
        throw new RangeError('invalid duration: 35 minutes')
      },
    } as ExtractorPlugin

    const extractor = new RecipeExtractor([plugin], scraperName)

    expect(extractor.extract('totalTime')).rejects.toThrow(ExtractionRuntimeException)
    expect(extractor.extract('totalTime')).rejects.toThrow(
      'Unexpected extraction error for field "totalTime" from plugin "SchemaOrgPlugin": invalid duration: 35 minutes',
    )
  })

  it('throws ExtractionRuntimeException for unexpected site-specific errors', () => {
    const extractor = new RecipeExtractor([], scraperName)

    expect(
      extractor.extract('title', () => {
        throw new TypeError('bad selector')
      }),
    ).rejects.toThrow(ExtractionRuntimeException)

    expect(
      extractor.extract('title', () => {
        throw new TypeError('bad selector')
      }),
    ).rejects.toThrow(
      'Unexpected extraction error for field "title" from site-specific extractor: bad selector',
    )
  })

  it('returns fresh instances for mutable optional defaults', async () => {
    const plugin = {
      name: 'None',
      priority: 0,
      $: load('<html><body></body></html>'),
      supports: () => false,
      extract: () => 'X',
    } as ExtractorPlugin

    const extractor = new RecipeExtractor([plugin], scraperName)

    const firstCategory = await extractor.extract('category')
    const secondCategory = await extractor.extract('category')
    firstCategory.add('leak')

    expect(firstCategory).not.toBe(secondCategory)
    expect(secondCategory.has('leak')).toBe(false)

    const firstEquipment = await extractor.extract('equipment')
    const secondEquipment = await extractor.extract('equipment')
    firstEquipment.add('leak')

    expect(firstEquipment).not.toBe(secondEquipment)
    expect(secondEquipment.has('leak')).toBe(false)

    const firstReviews = await extractor.extract('reviews')
    const secondReviews = await extractor.extract('reviews')
    firstReviews.set('user', 'text')

    expect(firstReviews).not.toBe(secondReviews)
    expect(secondReviews.has('user')).toBe(false)
  })
})
