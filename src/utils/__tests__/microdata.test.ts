import { describe, expect, it } from 'bun:test'

import * as cheerio from 'cheerio'

import { extractRecipeMicrodata } from '../microdata'

describe('microdata-extractor', () => {
  it('should extract simple microdata properties', () => {
    const html = `
      <div itemtype="https://schema.org/Recipe">
        <h1 itemprop="name">Test Recipe</h1>
        <meta itemprop="prepTime" content="PT15M">
      </div>
    `
    const $ = cheerio.load(html)
    const result = extractRecipeMicrodata($)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      '@type': 'Recipe',
      name: 'Test Recipe',
      prepTime: 'PT15M',
    })
  })

  it('prefers a content attribute on any element over its text', () => {
    const html = `
      <div itemtype="https://schema.org/Recipe">
        <h1 itemprop="name">Test Recipe</h1>
        <span itemprop="totalTime" content="PT30M">30 min</span>
        <time itemprop="prepTime" content="PT00H10M"></time>
        <time itemprop="cookTime" datetime="PT20M">20 minutes</time>
      </div>
    `
    const $ = cheerio.load(html)
    const result = extractRecipeMicrodata($)

    expect(result[0]).toEqual({
      '@type': 'Recipe',
      name: 'Test Recipe',
      totalTime: 'PT30M',
      prepTime: 'PT00H10M',
      cookTime: 'PT20M',
    })
  })

  it('reads an author link as a named Person, but other links as URLs', () => {
    const html = `
      <div itemtype="https://schema.org/Recipe">
        <h1 itemprop="name">Test Recipe</h1>
        <a itemprop="author" href="/food/chefs/rob_burns">Rob Burns</a>
        <a itemprop="url" href="/food/recipes/test">Test Recipe</a>
      </div>
    `
    const $ = cheerio.load(html)
    const result = extractRecipeMicrodata($)

    expect(result[0]).toEqual({
      '@type': 'Recipe',
      name: 'Test Recipe',
      author: { name: 'Rob Burns', url: '/food/chefs/rob_burns' },
      url: '/food/recipes/test',
    })
  })

  it("prefers an author link's content attribute over its text", () => {
    const html = `
      <div itemtype="https://schema.org/Recipe">
        <h1 itemprop="name">Test Recipe</h1>
        <a itemprop="author" content="Jane Doe" href="/jane">View profile</a>
      </div>
    `
    const $ = cheerio.load(html)

    expect(extractRecipeMicrodata($)[0]?.author).toEqual({ name: 'Jane Doe', url: '/jane' })
  })

  it("leaves an inline icon's SVG title out of a property's text", () => {
    const html = `
      <div itemtype="https://schema.org/Recipe">
        <li itemprop="recipeIngredient">
          <svg><title>Info</title><path d=""></path></svg>
          6 oz. Linguine
        </li>
      </div>
    `
    const $ = cheerio.load(html)

    expect(extractRecipeMicrodata($)[0]?.recipeIngredient).toBe('6 oz. Linguine')
    expect($('svg title').text()).toBe('Info')
  })

  it('should extract nested microdata objects', () => {
    const html = `
      <div itemtype="https://schema.org/Recipe">
        <h1 itemprop="name">Test Recipe</h1>
        <div itemprop="aggregateRating" itemtype="https://schema.org/AggregateRating">
          <meta itemprop="ratingValue" content="4">
          <meta itemprop="reviewCount" content="10">
        </div>
      </div>
    `
    const $ = cheerio.load(html)
    const result = extractRecipeMicrodata($)

    expect(result).toHaveLength(1)

    expect(result[0]).toEqual({
      '@type': 'Recipe',
      name: 'Test Recipe',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4',
        reviewCount: '10',
      },
    })
  })

  it('should handle multiple values for same property', () => {
    const html = `
      <div itemtype="https://schema.org/Recipe">
        <span itemprop="recipeIngredient">1 cup flour</span>
        <span itemprop="recipeIngredient">2 eggs</span>
      </div>
    `
    const $ = cheerio.load(html)
    const result = extractRecipeMicrodata($)

    expect(result[0].recipeIngredient).toEqual(['1 cup flour', '2 eggs'])
  })

  it('extract all aggregateRating props', () => {
    const html = `
      <div itemtype="https://schema.org/Recipe">
        <div itemprop="aggregateRating" itemscope="" itemtype="https://schema.org/AggregateRating">
          <div>
            <meta itemprop="ratingValue" content="4">
            <meta itemprop="bestRating" content="4">
            <meta itemprop="worstRating" content="0">
            <span itemprop="reviewCount">4</span>
          </div>
        </div>
      </div>
    `

    const $ = cheerio.load(html)
    const result = extractRecipeMicrodata($)

    expect(result).toHaveLength(1)

    expect(result[0]).toEqual({
      '@type': 'Recipe',
      aggregateRating: {
        '@type': 'AggregateRating',
        bestRating: '4',
        ratingValue: '4',
        reviewCount: '4',
        worstRating: '0',
      },
    })
  })
})
