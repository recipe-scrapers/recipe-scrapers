import { describe, expect, it } from 'bun:test'

import * as cheerio from 'cheerio'

import { hearstInstructions, hearstKeywords } from '@/scrapers/hearst'
import { stringsToInstructions } from '@/utils/instructions'

function steps(html: string): string[] {
  return hearstInstructions(cheerio.load(html), undefined).flatMap((group) =>
    group.items.map((item) => item.value),
  )
}

describe('hearstInstructions', () => {
  it('keeps Structured Data instructions when they have steps', () => {
    const prevValue = stringsToInstructions(['Mix.'])

    expect(hearstInstructions(cheerio.load('<ul class="directions"></ul>'), prevValue)).toBe(
      prevValue,
    )
  })

  it('reads numbered paragraphs without their step labels or inline styles', () => {
    const html = `<ul class="directions"><li>
      <style>.css-1{color:red}</style><p>1. Preheat oven.</p><p>Step 2 Bake for 20min.</p>
    </li></ul>`

    expect(steps(html)).toEqual(['Preheat oven.', 'Bake for 20min.'])
  })

  it('splits a list item on line breaks', () => {
    const html = '<ul class="directions"><li>Beat the cream.<br><br>Add 2 eggs.</li></ul>'

    expect(steps(html)).toEqual(['Beat the cream.', 'Add 2 eggs.'])
  })

  it('keeps a paragraph that wraps across source lines as one step', () => {
    const html = `<ul class="directions"><li>
      <p>Preheat the oven
        to 180°C.</p>
      <p>Bake until
        golden.</p>
    </li></ul>`

    expect(steps(html)).toEqual(['Preheat the oven to 180°C.', 'Bake until golden.'])
  })

  it('reads nested list items once', () => {
    const html = '<ul class="directions"><li><ol><li>Chop.</li><li>Fry.</li></ol></li></ul>'

    expect(steps(html)).toEqual(['Chop.', 'Fry.'])
  })

  it('throws when the page has no directions', () => {
    expect(() => hearstInstructions(cheerio.load('<p>Hi</p>'), undefined)).toThrow()
  })
})

describe('hearstKeywords', () => {
  it('drops CMS metadata', () => {
    const keywords = new Set(['locale: US', 'icing', 'TOTALTIME: 00:10:00', 'dessert'])

    expect([...hearstKeywords(keywords)]).toEqual(['icing', 'dessert'])
  })
})
