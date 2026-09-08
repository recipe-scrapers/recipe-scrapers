import { beforeEach, describe, expect, it } from 'bun:test'

import { load } from 'cheerio'

import { ExtractorNotFoundException } from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'

import { OpenGraphException, OpenGraphPlugin } from '../opengraph.extractor'

describe('OpenGraphPlugin', () => {
  const htmlWithMeta = `
    <html><head>
      <meta property="og:site_name" content="Test Site"/>
      <meta property="og:image" content="http://example.com/image.jpg"/>
    </head><body></body></html>`

  const htmlWithNameOnly = `
    <html><head>
      <meta name="og:site_name" content="Alt Site"/>
    </head><body></body></html>`

  const htmlWithBadImage = `
    <html><head>
      <meta property="og:image" content="/relative/path.png"/>
    </head><body></body></html>`

  let plugin: OpenGraphPlugin

  it('has correct name and priority', () => {
    plugin = new OpenGraphPlugin(load(htmlWithMeta))
    expect(plugin.name).toBe('OpenGraphPlugin')
    expect(plugin.priority).toBe(60)
  })

  describe('supports()', () => {
    beforeEach(() => {
      plugin = new OpenGraphPlugin(load(htmlWithMeta))
    })

    it('returns true for supported fields', () => {
      expect(plugin.supports('siteName')).toBe(true)
      expect(plugin.supports('image')).toBe(true)
    })

    it('returns false for unsupported fields', () => {
      expect(plugin.supports('title')).toBe(false)
      expect(plugin.supports('author')).toBe(false)
      expect(plugin.supports('ingredients')).toBe(false)
    })
  })

  describe('extract()', () => {
    it('extracts siteName from property meta tag', () => {
      plugin = new OpenGraphPlugin(load(htmlWithMeta))
      const value = plugin.extract('siteName')
      expect(value).toBe('Test Site')
    })

    it('extracts siteName from name meta tag if property missing', () => {
      plugin = new OpenGraphPlugin(load(htmlWithNameOnly))
      const value = plugin.extract('siteName')
      expect(value).toBe('Alt Site')
    })

    it('extracts valid image URL', () => {
      plugin = new OpenGraphPlugin(load(htmlWithMeta))
      const img = plugin.extract('image')
      expect(img).toBe('http://example.com/image.jpg')
    })

    it('throws OpenGraphException when siteName meta missing', () => {
      plugin = new OpenGraphPlugin(load('<html></html>'))
      expect(() => plugin.extract('siteName')).toThrow(OpenGraphException)
      try {
        plugin.extract('siteName')
      } catch (err) {
        expect(err).toBeInstanceOf(OpenGraphException)
        expect((err as Error).message).toBe('No value found for "siteName"')
        expect((err as Error).name).toBe('OpenGraphException')
      }
    })

    it('throws OpenGraphException when image URL is invalid', () => {
      plugin = new OpenGraphPlugin(load(htmlWithBadImage))
      expect(() => plugin.extract('image')).toThrow(OpenGraphException)
      try {
        plugin.extract('image')
      } catch (err) {
        expect(err).toBeInstanceOf(OpenGraphException)
        expect((err as Error).message).toBe('No value found for "image"')
      }
    })

    it('throws ExtractorNotFoundException for unsupported field', () => {
      plugin = new OpenGraphPlugin(load(htmlWithMeta))
      expect(() => plugin.extract('name' as keyof RecipeFields)).toThrow(ExtractorNotFoundException)
      try {
        plugin.extract('name' as keyof RecipeFields)
      } catch (err) {
        expect(err).toBeInstanceOf(ExtractorNotFoundException)
        expect((err as Error).message).toBe('No extractor found for field: name')
      }
    })
  })
})
