import { describe, expect, it } from 'bun:test'

import * as cheerio from 'cheerio'

import type { Ingredients } from '@/types/recipe.interface'

import {
  bestMatch,
  createIngredientGroup,
  createIngredientItem,
  groupIngredients,
  isIngredientGroup,
  isIngredientItem,
  isIngredients,
  scoreSentenceSimilarity,
  stringsToIngredients,
} from '../ingredients'

/** Helper to get ingredient values from a result */
function getGroupValues(
  result: Ingredients,
  groupName: string | null,
): string[] {
  const group = result.find((g) => g.name === groupName)
  return group ? group.items.map((i) => i.value) : []
}

describe('createIngredientItem', () => {
  it('should create an ingredient item with a generated ID', () => {
    const item = createIngredientItem('flour')
    expect(item).toEqual({ value: 'flour' })
  })
})

describe('createIngredientGroup', () => {
  it('should create an ingredient group with a generated ID', () => {
    const group = createIngredientGroup('Dry Ingredients')
    expect(group).toEqual({ name: 'Dry Ingredients', items: [] })
  })

  it('should create a group with items', () => {
    const items = [createIngredientItem('flour'), createIngredientItem('sugar')]
    const group = createIngredientGroup('Dry Ingredients', items)
    expect(group.items).toHaveLength(2)
  })
})

describe('isIngredientItem', () => {
  it('should return true for valid ingredient item', () => {
    expect(isIngredientItem({ value: 'flour' })).toBe(true)
  })

  it('should return false for invalid values', () => {
    expect(isIngredientItem(null)).toBe(false)
    expect(isIngredientItem(undefined)).toBe(false)
    expect(isIngredientItem('string')).toBe(false)
    expect(isIngredientItem({ value: null })).toBe(false)
  })
})

describe('isIngredientGroup', () => {
  it('should return true for valid ingredient group', () => {
    const group = createIngredientGroup('Test', [createIngredientItem('flour')])
    expect(isIngredientGroup(group)).toBe(true)
  })

  it('should return false for invalid values', () => {
    expect(isIngredientGroup(null)).toBe(false)
    expect(isIngredientGroup({ name: 'Test' })).toBe(false) // missing items
    expect(isIngredientGroup({ name: 'Test', items: 'invalid' })).toBe(false)
  })
})

describe('isIngredients', () => {
  it('should return true for valid ingredients array', () => {
    const ingredients = stringsToIngredients(['flour', 'sugar'])
    expect(isIngredients(ingredients)).toBe(true)
  })

  it('should return false for invalid values', () => {
    expect(isIngredients(null)).toBe(false)
    expect(isIngredients('string')).toBe(false)
    expect(isIngredients([{ invalid: 'object' }])).toBe(false)
  })
})

describe('stringsToIngredients', () => {
  it('should convert string array to Ingredients with default group', () => {
    const result = stringsToIngredients(['flour', 'sugar', 'eggs'])
    expect(result).toEqual([
      {
        name: null,
        items: [{ value: 'flour' }, { value: 'sugar' }, { value: 'eggs' }],
      },
    ])
  })

  it('should use custom group name', () => {
    const result = stringsToIngredients(['flour', 'sugar'], 'Dry Ingredients')
    expect(result).toEqual([
      {
        name: 'Dry Ingredients',
        items: [{ value: 'flour' }, { value: 'sugar' }],
      },
    ])
  })
})

describe('scoreSentenceSimilarity', () => {
  it('returns 1 for exact match', () => {
    expect(
      scoreSentenceSimilarity('¼ cup maple syrup', '¼ cup maple syrup'),
    ).toBe(1.0)
  })

  it('should return 0 for strings shorter than 2 characters', () => {
    expect(scoreSentenceSimilarity('a', 'hello')).toBe(0)
    expect(scoreSentenceSimilarity('hello', 'b')).toBe(0)
  })

  it("returns 0 when there's no match", () => {
    expect(scoreSentenceSimilarity('a', '4 sprig fresh thyme')).toBe(0.0)
    expect(scoreSentenceSimilarity('4 sprig fresh thyme', '')).toBe(0.0)
  })

  it('handles special characters', () => {
    expect(scoreSentenceSimilarity('!@#$%^', '*&^%$#')).toBe(0.0)
  })

  it('scores numerical strings correctly', () => {
    expect(scoreSentenceSimilarity('123', '1234')).toBe(0.8)
  })

  it('is close for similar but not exact', () => {
    const result = scoreSentenceSimilarity('16oz firm tofu', '16 oz firm tofu')
    expect(result).toBeCloseTo(0.8888888888888888, 2)
  })

  it('returns 0 when first string is empty', () => {
    expect(scoreSentenceSimilarity('', 'anything here')).toBe(0.0)
  })
})

describe('bestMatch', () => {
  it('finds exact match', () => {
    const targets = [
      '¼ cup vegan mayonnaise',
      'apple cider vinegar',
      '¼ tsp salt',
      '1 cup shredded red cabbage',
    ]
    expect(bestMatch('¼ cup vegan mayonnaise', targets)).toBe(
      '¼ cup vegan mayonnaise',
    )
  })

  it('should return the best matching string', () => {
    const testString = '1 cup flour'
    const targetStrings = ['2 cups sugar', '1 cup all-purpose flour', '3 eggs']
    const result = bestMatch(testString, targetStrings)
    expect(result).toBe('1 cup all-purpose flour')
  })

  it('selects the closest non-exact match', () => {
    const targets = [
      'apple cider vinegar',
      '¼ tsp salt',
      '1 cup shredded red cabbage',
      '5 large soft tortilla',
    ]
    expect(bestMatch('large tortilla', targets)).toBe('5 large soft tortilla')
  })

  it('should return first string when all have equal scores', () => {
    const testString = 'xyz'
    const targetStrings = ['abc', 'def', 'ghi']
    const result = bestMatch(testString, targetStrings)
    expect(result).toBe('abc')
  })

  it('handles singular vs plural', () => {
    const targets = ['2 medium tomato', '½ head butter lettuce', '1 carrot']
    expect(bestMatch('tomato', targets)).toBe('2 medium tomato')
  })

  it("doesn't return the query when it's not in targets", () => {
    const targets = [
      '¼ cup vegan mayonnaise',
      'apple cider vinegar',
      '¼ tsp salt',
    ]
    expect(bestMatch('¼ cup maple syrup', targets)).not.toBe(
      '¼ cup maple syrup',
    )
  })

  it('throws an error for empty target list', () => {
    expect(() => bestMatch('any string', [])).toThrow()
  })
})

describe('findSelectors', () => {
  it('should prioritize custom selectors over defaults', () => {
    const html = `
      <div>
        <h4 class="wprm-recipe-group-name">WPRM Group</h4>
        <div class="wprm-recipe-ingredient">WPRM ingredient</div>
        <h3 class="custom-heading">Custom Group</h3>
        <li class="custom-ingredient">Custom ingredient</li>
      </div>
    `
    const $ = cheerio.load(html)
    const ingredientsList = ['Custom ingredient']

    // Should use custom selectors even when WPRM selectors exist
    const result = groupIngredients(
      $,
      ingredientsList,
      '.custom-heading',
      '.custom-ingredient',
    )

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Custom Group')
  })
})

describe('groupIngredients', () => {
  it('should return default group when no grouping selectors are found', () => {
    const $ = cheerio.load('<div></div>')
    const ingredientsList = ['flour', 'sugar', 'eggs']
    const result = groupIngredients($, ingredientsList)

    expect(result).toEqual([
      {
        name: null,
        items: [{ value: 'flour' }, { value: 'sugar' }, { value: 'eggs' }],
      },
    ])
  })

  it('should return default group when selectors are provided but not found in DOM', () => {
    const $ = cheerio.load('<div></div>')
    const ingredientsList = ['flour', 'sugar', 'eggs']
    const result = groupIngredients(
      $,
      ingredientsList,
      '.heading',
      '.ingredient',
    )

    expect(result).toEqual([
      {
        name: null,
        items: [{ value: 'flour' }, { value: 'sugar' }, { value: 'eggs' }],
      },
    ])
  })

  it('should group ingredients with WPRM selectors', () => {
    const html = `
      <div>
        <h4 class="wprm-recipe-group-name">Dry Ingredients</h4>
        <div class="wprm-recipe-ingredient">2 cups flour</div>
        <div class="wprm-recipe-ingredient">1 cup sugar</div>
        <h4 class="wprm-recipe-group-name">Wet Ingredients</h4>
        <div class="wprm-recipe-ingredient">2 eggs</div>
      </div>
    `
    const $ = cheerio.load(html)
    const ingredientsList = ['2 cups flour', '1 cup sugar', '2 eggs']
    const result = groupIngredients($, ingredientsList)

    expect(result).toHaveLength(2)

    const dryValues = getGroupValues(result, 'Dry Ingredients')
    const wetValues = getGroupValues(result, 'Wet Ingredients')

    expect(dryValues).toContain('2 cups flour')
    expect(dryValues).toContain('1 cup sugar')
    expect(wetValues).toContain('2 eggs')
  })

  it('should use custom selectors when provided', () => {
    const html = `
      <div>
        <h3 class="custom-heading">Custom Group</h3>
        <li class="custom-ingredient">ingredient 1</li>
        <li class="custom-ingredient">ingredient 2</li>
      </div>
    `
    const $ = cheerio.load(html)
    const ingredientsList = ['ingredient 1', 'ingredient 2']
    const result = groupIngredients(
      $,
      ingredientsList,
      '.custom-heading',
      '.custom-ingredient',
    )

    expect(result).toEqual([
      {
        name: 'Custom Group',
        items: [{ value: 'ingredient 1' }, { value: 'ingredient 2' }],
      },
    ])
  })

  it('should fall back to ungrouped ingredients when ingredient count mismatch', () => {
    const html = `
      <div>
        <h4 class="wprm-recipe-group-name">Group</h4>
        <div class="wprm-recipe-ingredient">ingredient 1</div>
      </div>
    `
    const $ = cheerio.load(html)
    // More ingredients than found in HTML
    const ingredientsList = ['ingredient 1', 'ingredient 2']

    // Should fall back to ungrouped ingredients instead of throwing
    const result = groupIngredients($, ingredientsList)
    expect(result).toEqual([
      {
        name: null,
        items: [{ value: 'ingredient 1' }, { value: 'ingredient 2' }],
      },
    ])
  })

  it('should use default heading when heading text is empty', () => {
    const html = `
      <div>
        <h4 class="wprm-recipe-group-name"></h4>
        <div class="wprm-recipe-ingredient">ingredient 1</div>
      </div>
    `
    const $ = cheerio.load(html)
    const ingredientsList = ['ingredient 1']
    const result = groupIngredients($, ingredientsList)

    expect(result).toEqual([
      {
        name: null,
        items: [{ value: 'ingredient 1' }],
      },
    ])
  })

  it('should handle ingredients without preceding heading', () => {
    const html = `
      <div>
        <div class="wprm-recipe-ingredient">ingredient 1</div>
        <h4 class="wprm-recipe-group-name">Group 1</h4>
        <div class="wprm-recipe-ingredient">ingredient 2</div>
      </div>
    `
    const $ = cheerio.load(html)
    const ingredientsList = ['ingredient 1', 'ingredient 2']
    const result = groupIngredients($, ingredientsList)

    // Default heading for first ingredient
    const groupNames = result.map((g) => g.name)
    expect(groupNames).toContain(null)
    expect(groupNames).toContain('Group 1')
  })

  it('should handle multiple ingredients under same heading', () => {
    const html = `
      <div>
        <h4 class="wprm-recipe-group-name">Vegetables</h4>
        <div class="wprm-recipe-ingredient">2 carrots, diced</div>
        <div class="wprm-recipe-ingredient">1 onion, chopped</div>
        <div class="wprm-recipe-ingredient">3 celery stalks</div>
      </div>
    `
    const $ = cheerio.load(html)
    const ingredientsList = [
      '2 carrots, diced',
      '1 onion, chopped',
      '3 celery stalks',
    ]
    const result = groupIngredients($, ingredientsList)

    expect(result).toEqual([
      {
        name: 'Vegetables',
        items: [
          { value: '2 carrots, diced' },
          { value: '1 onion, chopped' },
          { value: '3 celery stalks' },
        ],
      },
    ])
  })

  it('should handle fuzzy matching for similar ingredient text', () => {
    const html = `
      <div>
        <h4 class="wprm-recipe-group-name">Flour</h4>
        <div class="wprm-recipe-ingredient">2 cups all purpose flour</div>
      </div>
    `
    const $ = cheerio.load(html)
    // Note the hyphen difference
    const ingredientsList = ['2 cups all-purpose flour']
    const result = groupIngredients($, ingredientsList)

    expect(result).toEqual([
      {
        name: 'Flour',
        items: [{ value: '2 cups all-purpose flour' }],
      },
    ])
  })

  it('should handle nested HTML structure', () => {
    const html = `
      <div class="recipe-section">
        <div class="group-wrapper">
          <h4 class="wprm-recipe-group-name">Sauce</h4>
          <ul>
            <li class="wprm-recipe-ingredient">1 tbsp soy sauce</li>
            <li class="wprm-recipe-ingredient">2 tsp sesame oil</li>
          </ul>
        </div>
      </div>
    `
    const $ = cheerio.load(html)
    const ingredientsList = ['1 tbsp soy sauce', '2 tsp sesame oil']
    const result = groupIngredients($, ingredientsList)

    expect(result).toEqual([
      {
        name: 'Sauce',
        items: [{ value: '1 tbsp soy sauce' }, { value: '2 tsp sesame oil' }],
      },
    ])
  })

  it('should handle empty ingredient text gracefully', () => {
    const html = `
      <div>
        <h4 class="wprm-recipe-group-name">Group</h4>
        <div class="wprm-recipe-ingredient"></div>
        <div class="wprm-recipe-ingredient">real ingredient</div>
      </div>
    `
    const $ = cheerio.load(html)
    const ingredientsList = ['real ingredient']

    // Should handle the empty ingredient element without crashing
    expect(() => groupIngredients($, ingredientsList)).not.toThrow()
  })

  it('should handle multiple empty headings with same default name', () => {
    const html = `
      <div>
        <h4 class="wprm-recipe-group-name"></h4>
        <div class="wprm-recipe-ingredient">ingredient 1</div>
        <h4 class="wprm-recipe-group-name">   </h4>
        <div class="wprm-recipe-ingredient">ingredient 2</div>
      </div>
    `
    const $ = cheerio.load(html)
    const ingredientsList = ['ingredient 1', 'ingredient 2']
    const result = groupIngredients($, ingredientsList)

    expect(result).toEqual([
      {
        name: null,
        items: [{ value: 'ingredient 1' }, { value: 'ingredient 2' }],
      },
    ])
  })

  it('should handle grouping under both a default heading and a found heading', () => {
    const html = `
      <div class="ingredients">
        <h2>Ingredients</h2>
        <ul>
          <li>ingredient 1</li>
        </ul>
        <h3>Heading</h3>
        <ul>
          <li>ingredient 2</li>
        </ul>
      </div>
    `

    const $ = cheerio.load(html)
    const ingredientsList = ['ingredient 1', 'ingredient 2']
    const result = groupIngredients(
      $,
      ingredientsList,
      '.ingredients h3',
      '.ingredients li',
    )

    expect(result).toHaveLength(2)
    expect(getGroupValues(result, null)).toEqual(['ingredient 1'])
    expect(getGroupValues(result, 'Heading')).toEqual(['ingredient 2'])
  })

  it('should keep grouped output when duplicate ingredient text appears in multiple groups', () => {
    const html = `
      <div>
        <h4 class="wprm-recipe-group-name">Sauce</h4>
        <div class="wprm-recipe-ingredient">2 eggs</div>
        <h4 class="wprm-recipe-group-name">Topping</h4>
        <div class="wprm-recipe-ingredient">2 eggs</div>
      </div>
    `

    const $ = cheerio.load(html)
    const ingredientsList = ['2 eggs', '2 eggs']
    const result = groupIngredients($, ingredientsList)

    expect(result).toEqual([
      {
        items: [{ value: '2 eggs' }],
        name: 'Sauce',
      },
      {
        items: [{ value: '2 eggs' }],
        name: 'Topping',
      },
    ])
  })
})
