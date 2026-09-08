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
