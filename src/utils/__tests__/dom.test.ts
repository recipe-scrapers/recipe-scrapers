import { describe, expect, it } from 'bun:test'

import * as cheerio from 'cheerio'

import { textGroups, texts } from '../dom'

describe('texts', () => {
  const $ = cheerio.load(`
    <ul>
      <li>  2 cups   flour </li>
      <li> </li>
      <li><img alt="photo">1 cup sugar<figure>Photo credit</figure></li>
    </ul>
  `)

  it('returns the normalized text of each element, skipping empty ones', () => {
    expect(texts($, 'li')).toEqual(['2 cups flour', '1 cup sugarPhoto credit'])
  })

  it('accepts elements already selected', () => {
    expect(texts($, $('li').first())).toEqual(['2 cups flour'])
  })

  it('leaves excluded descendants out of the text without changing the page', () => {
    expect(texts($, 'li', 'figure')).toEqual(['2 cups flour', '1 cup sugar'])
    expect($('figure').text()).toBe('Photo credit')
  })
})

describe('textGroups', () => {
  const $ = cheerio.load(`
    <p class="step">Preheat the oven.</p>
    <h3>For the crust:</h3>
    <p class="step">Mix the flour.</p>
    <h3>Unused heading</h3>
    <h3>Filling</h3>
    <p class="step">Fill the crust.</p>
  `)

  it('groups items under the heading before them', () => {
    expect(textGroups($, { heading: 'h3', item: '.step' })).toEqual([
      { name: null, items: ['Preheat the oven.'] },
      { name: 'For the crust', items: ['Mix the flour.'] },
      { name: 'Filling', items: ['Fill the crust.'] },
    ])
  })

  it('returns one unnamed group without a heading selector', () => {
    expect(textGroups($, { item: '.step' })).toEqual([
      { name: null, items: ['Preheat the oven.', 'Mix the flour.', 'Fill the crust.'] },
    ])
  })

  it('returns no groups when nothing matches', () => {
    expect(textGroups($, { heading: 'h3', item: '.missing' })).toEqual([])
  })
})
