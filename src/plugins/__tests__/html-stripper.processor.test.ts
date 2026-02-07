import { describe, expect, it } from 'bun:test'
import type { Ingredients, Instructions } from '../../types/recipe.interface'
import {
  createIngredientGroup,
  createIngredientItem,
} from '../../utils/ingredients'
import {
  createInstructionGroup,
  createInstructionItem,
} from '../../utils/instructions'
import { HtmlStripperPlugin } from '../html-stripper.processor'

describe('HtmlStripperPlugin', () => {
  const plugin = new HtmlStripperPlugin()

  it('should process only title, instructions, and ingredients fields', () => {
    expect(plugin.shouldProcess('title')).toBe(true)
    expect(plugin.shouldProcess('instructions')).toBe(true)
    expect(plugin.shouldProcess('ingredients')).toBe(true)
    expect(plugin.shouldProcess('category')).toBe(false)
  })

  it('strips HTML from string values', () => {
    expect(plugin.process('title', '<b>Hello &amp; World</b>')).toBe(
      'Hello & World',
    )
    expect(plugin.process('title', 'No tags')).toBe('No tags')
    expect(plugin.process('title', '<span>Test &lt;tag&gt;</span>')).toBe(
      'Test <tag>',
    )
    expect(plugin.process('description', '<span>Hello&nbsp;World</span>')).toBe(
      'Hello World',
    )
  })

  it('strips HTML from instructions', () => {
    const input: Instructions = [
      createInstructionGroup(null, [
        createInstructionItem('<b>Step 1</b>'),
        createInstructionItem('Step &amp; 2'),
      ]),
    ]
    const output = plugin.process('instructions', input)
    expect(output[0].items.map((i) => i.value)).toEqual(['Step 1', 'Step & 2'])
  })

  it('strips HTML from ingredients', () => {
    const input: Ingredients = [
      createIngredientGroup('Ingredients', [
        createIngredientItem('<i>1 cup</i> flour'),
        createIngredientItem('2 &lt;b&gt;eggs&lt;/b&gt;'),
      ]),
    ]
    const output = plugin.process('ingredients', input) as Ingredients
    expect(output[0].items.map((i) => i.value)).toEqual([
      '1 cup flour',
      '2 <b>eggs</b>',
    ])
  })

  it('strips HTML from ingredient groups', () => {
    const input: Ingredients = [
      createIngredientGroup('<b>Group 1</b>', [
        createIngredientItem('<i>1 cup</i> flour'),
        createIngredientItem('2 &lt;b&gt;eggs&lt;/b&gt;'),
      ]),
      createIngredientGroup('Other', [
        createIngredientItem('<span>3</span> apples'),
      ]),
    ]
    const output = plugin.process('ingredients', input) as Ingredients

    expect(output).toHaveLength(2)
    expect(output[0].name).toBe('Group 1')
    expect(output[0].items.map((i) => i.value)).toEqual([
      '1 cup flour',
      '2 <b>eggs</b>',
    ])
    expect(output[1].name).toBe('Other')
    expect(output[1].items.map((i) => i.value)).toEqual(['3 apples'])
  })

  it('decodes all HTML entities', () => {
    expect(plugin.process('title', 'Cr&egrave;me br&ucirc;l&eacute;e')).toBe(
      'Crème brûlée',
    )
    expect(plugin.process('title', '&#x27;quoted&#x27;')).toBe("'quoted'")
    expect(plugin.process('title', '100&deg;C')).toBe('100°C')
  })

  it('returns value unchanged for non-target fields', () => {
    expect(plugin.process('category', new Set(['<b>cat</b>']))).toEqual(
      new Set(['<b>cat</b>']),
    )
  })
})
