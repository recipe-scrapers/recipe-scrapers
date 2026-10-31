import { describe, expect, it } from 'bun:test'

import { load } from 'cheerio'

import { extractWprmNotes } from '../extract-wprm-notes'

describe('extractWprmNotes', () => {
  it('parses WPRM notes from list items', () => {
    const $ = load(`
      <div class="wprm-recipe-container">
        <div class="wprm-recipe-notes-container">
          <div class="wprm-recipe-notes">
            <ol>
              <li>Store in an airtight container.</li>
              <li>Cool completely before storing.</li>
            </ol>
          </div>
        </div>
      </div>
    `)

    expect(extractWprmNotes($)).toEqual([
      {
        name: null,
        items: [
          { value: 'Store in an airtight container.' },
          { value: 'Cool completely before storing.' },
        ],
      },
    ])
  })

  it('parses span-based WPRM notes and ignores spacer blocks', () => {
    const $ = load(`
      <div class="wprm-recipe-container">
        <div class="wprm-recipe-notes-container">
          <div class="wprm-recipe-notes">
            <span style="display:block;">Use within 3 days.&nbsp;</span>
            <div class="wprm-spacer"></div>
            <span style="display:block;"><strong>Tip:</strong> Serve warm.</span>
          </div>
        </div>
      </div>
    `)

    expect(extractWprmNotes($)).toEqual([
      {
        name: null,
        items: [{ value: 'Use within 3 days.' }, { value: 'Tip: Serve warm.' }],
      },
    ])
  })

  it('merges continuation paragraphs into the preceding numbered note', () => {
    const $ = load(`
      <div class="wprm-recipe-container">
        <div class="wprm-recipe-notes-container">
          <div class="wprm-recipe-notes">
            <span style="display:block;"><strong>Scaling</strong> works well.</span>
            <div class="wprm-spacer"></div>
            <hr>
            <span style="display:block;"><strong>1. Beef</strong> – use chuck.</span>
            <div class="wprm-spacer"></div>
            <span style="display:block;">Cut your own pieces.</span>
            <div class="wprm-spacer"></div>
            <span style="display:block;"><strong>2. Storage</strong> – keeps 5 days.</span>
          </div>
        </div>
      </div>
    `)

    expect(extractWprmNotes($)).toEqual([
      {
        name: null,
        items: [
          { value: 'Scaling works well.' },
          { value: '1. Beef – use chuck. Cut your own pieces.' },
          { value: '2. Storage – keeps 5 days.' },
        ],
      },
    ])
  })

  it('keeps unnumbered notes separate when only one note is numbered', () => {
    const $ = load(`
      <div class="wprm-recipe-container">
        <div class="wprm-recipe-notes-container">
          <div class="wprm-recipe-notes">
            <span style="display:block;">1. Use fresh herbs.</span>
            <span style="display:block;">Leftovers freeze well.</span>
          </div>
        </div>
      </div>
    `)

    expect(extractWprmNotes($)).toEqual([
      {
        name: null,
        items: [{ value: '1. Use fresh herbs.' }, { value: 'Leftovers freeze well.' }],
      },
    ])
  })

  it('falls back to the first standalone notes container', () => {
    const $ = load(`
      <div class="wprm-recipe-notes-container">
        <div class="wprm-recipe-notes">
          <span style="display:block;">Fallback notes.</span>
        </div>
      </div>
    `)

    expect(extractWprmNotes($)).toEqual([
      {
        name: null,
        items: [{ value: 'Fallback notes.' }],
      },
    ])
  })

  it('returns undefined when no supported WPRM notes block exists', () => {
    const $ = load('<div class="recipe"><p>No notes here.</p></div>')
    expect(extractWprmNotes($)).toBeUndefined()
  })
})
