import { describe, expect, it } from 'bun:test'

import type { Ingredients } from '@/types/recipe.interface'

import { IngredientParserPlugin } from '../ingredient-parser.processor'

describe('IngredientParserPlugin', () => {
  const plugin = new IngredientParserPlugin()

  describe('shouldProcess', () => {
    it('should return true for ingredients field', () => {
      expect(plugin.shouldProcess('ingredients')).toBe(true)
    })

    it('should return false for other fields', () => {
      expect(plugin.shouldProcess('title')).toBe(false)
      expect(plugin.shouldProcess('description')).toBe(false)
      expect(plugin.shouldProcess('instructions')).toBe(false)
    })
  })

  describe('process', () => {
    it('should parse a simple ingredient', () => {
      const ingredients: Ingredients = [
        {
          name: null,
          items: [{ value: '2 cups flour' }],
        },
      ]

      const result = plugin.process('ingredients', ingredients) as Ingredients

      expect(result).toEqual([
        {
          name: null,
          items: [
            {
              value: '2 cups flour',
              parsed: {
                quantity: 2,
                quantity2: null,
                unitOfMeasure: 'cups',
                unitOfMeasureID: 'cup',
                description: 'flour',
                isGroupHeader: false,
              },
            },
          ],
        },
      ])
    })

    it('should parse ingredients with ranges', () => {
      const ingredients: Ingredients = [
        {
          name: null,
          items: [{ value: '1-2 tablespoons olive oil' }],
        },
      ]

      const result = plugin.process('ingredients', ingredients) as Ingredients

      expect(result[0].items[0].parsed).toMatchObject({
        quantity: 1,
        quantity2: 2,
        unitOfMeasureID: 'tablespoon',
        description: 'olive oil',
      })
    })

    it('should parse ingredients without units', () => {
      const ingredients: Ingredients = [
        {
          name: null,
          items: [{ value: '3 eggs' }],
        },
      ]

      const result = plugin.process('ingredients', ingredients) as Ingredients

      expect(result[0].items[0].parsed).toEqual({
        quantity: 3,
        quantity2: null,
        unitOfMeasure: null,
        unitOfMeasureID: null,
        description: 'eggs',
        isGroupHeader: false,
      })
    })

    it('should handle fractions', () => {
      const ingredients: Ingredients = [
        {
          name: null,
          items: [{ value: '1/2 cup sugar' }],
        },
      ]

      const result = plugin.process('ingredients', ingredients) as Ingredients

      expect(result[0].items[0].parsed).toMatchObject({
        quantity: 0.5,
        quantity2: null,
        unitOfMeasureID: 'cup',
        description: 'sugar',
      })
    })

    it('should handle mixed numbers', () => {
      const ingredients: Ingredients = [
        {
          name: null,
          items: [{ value: '1 1/2 cups milk' }],
        },
      ]

      const result = plugin.process('ingredients', ingredients) as Ingredients

      expect(result[0].items[0].parsed).toMatchObject({
        quantity: 1.5,
        unitOfMeasureID: 'cup',
        description: 'milk',
      })
    })

    it('should preserve group names', () => {
      const ingredients: Ingredients = [
        {
          name: 'For the sauce',
          items: [{ value: '2 tablespoons butter' }, { value: '1 cup cream' }],
        },
        {
          name: 'For the pasta',
          items: [{ value: '200g spaghetti' }],
        },
      ]

      const result = plugin.process('ingredients', ingredients) as Ingredients

      expect(result[0].name).toBe('For the sauce')
      expect(result[1].name).toBe('For the pasta')
      expect(result[0].items).toHaveLength(2)
      expect(result[1].items).toHaveLength(1)
    })

    it('should handle group headers in ingredient text', () => {
      const ingredients: Ingredients = [
        {
          name: null,
          items: [{ value: 'For the topping:' }],
        },
      ]

      const result = plugin.process('ingredients', ingredients) as Ingredients

      expect(result[0].items[0].parsed?.isGroupHeader).toBe(true)
    })

    it('should return non-ingredient values unchanged', () => {
      const title = 'My Recipe'
      const result = plugin.process('title', title)
      expect(result).toBe(title)
    })

    it('should return non-array ingredients unchanged', () => {
      const invalidValue = 'not an array'
      const result = plugin.process('ingredients', invalidValue)
      expect(result).toBe(invalidValue)
    })
  })

  describe('with normalizeUOM option', () => {
    const pluginWithNormalize = new IngredientParserPlugin({
      normalizeUOM: true,
    })

    it('should normalize unit of measure', () => {
      const ingredients: Ingredients = [
        {
          name: null,
          items: [{ value: '2 tbsp butter' }],
        },
      ]

      const result = pluginWithNormalize.process('ingredients', ingredients) as Ingredients

      expect(result[0].items[0].parsed).toMatchObject({
        quantity: 2,
        unitOfMeasure: 'tablespoon',
        unitOfMeasureID: 'tablespoon',
        description: 'butter',
      })
    })
  })
})
