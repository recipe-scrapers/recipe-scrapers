import { describe, expect, expectTypeOf, it } from 'bun:test'
import type { RecipeObject } from '@/types/recipe.interface'
import {
  IngredientGroupSchema,
  IngredientItemSchema,
  IngredientsSchema,
  InstructionGroupSchema,
  InstructionItemSchema,
  InstructionsSchema,
  LinkSchema,
  RecipeObjectSchema,
} from '../recipe.schema'

describe('IngredientItemSchema', () => {
  it('should validate a valid ingredient item', () => {
    const valid = { value: '2 cups flour' }
    const result = IngredientItemSchema.parse(valid)
    expect(result.value).toBe('2 cups flour')
  })

  it('should trim whitespace from value', () => {
    const withWhitespace = { value: '  2 cups flour  ' }
    const result = IngredientItemSchema.parse(withWhitespace)
    expect(result.value).toBe('2 cups flour')
  })

  it('should reject empty ingredient value', () => {
    const empty = { value: '' }
    expect(() => IngredientItemSchema.parse(empty)).toThrow(
      'Ingredient value cannot be empty',
    )
  })

  it('should reject missing value', () => {
    const missing = {}
    expect(() => IngredientItemSchema.parse(missing)).toThrow(
      'Ingredient value must be a string',
    )
  })

  it('should reject non-string value', () => {
    const invalid = { value: 123 }
    expect(() => IngredientItemSchema.parse(invalid)).toThrow(
      'Ingredient value must be a string',
    )
  })
})

describe('IngredientGroupSchema', () => {
  it('should validate a valid ingredient group', () => {
    const valid = {
      name: 'For the dough',
      items: [{ value: '2 cups flour' }, { value: '1 cup water' }],
    }
    const result = IngredientGroupSchema.parse(valid)
    expect(result.name).toBe('For the dough')
    expect(result.items).toHaveLength(2)
  })

  it('should accept null name for ungrouped ingredients', () => {
    const ungrouped = {
      name: null,
      items: [{ value: '2 cups flour' }],
    }
    const result = IngredientGroupSchema.parse(ungrouped)
    expect(result.name).toBeNull()
  })

  it('should reject group with empty items array', () => {
    const empty = {
      name: 'Test',
      items: [],
    }
    expect(() => IngredientGroupSchema.parse(empty)).toThrow(
      'Ingredient group must have at least one item',
    )
  })
})

describe('IngredientsSchema', () => {
  it('should validate valid ingredients with one group', () => {
    const valid = [
      {
        name: null,
        items: [{ value: '2 cups flour' }, { value: '1 cup water' }],
      },
    ]
    const result = IngredientsSchema.parse(valid)
    expect(result).toHaveLength(1)
    expect(result[0].items).toHaveLength(2)
  })

  it('should validate valid ingredients with multiple groups', () => {
    const valid = [
      {
        name: 'For the dough',
        items: [{ value: '2 cups flour' }],
      },
      {
        name: 'For the filling',
        items: [{ value: '1 cup sugar' }],
      },
    ]
    const result = IngredientsSchema.parse(valid)
    expect(result).toHaveLength(2)
  })

  it('should reject empty ingredients array', () => {
    const empty: unknown[] = []
    expect(() => IngredientsSchema.parse(empty)).toThrow(
      'Recipe must have at least one ingredient group',
    )
  })

  it('should reject ingredients with no actual items', () => {
    const noItems = [
      {
        name: 'Test',
        items: [],
      },
    ]
    expect(() => IngredientsSchema.parse(noItems)).toThrow()
  })
})

describe('InstructionItemSchema', () => {
  it('should validate a valid instruction item', () => {
    const valid = { value: 'Mix flour and water' }
    const result = InstructionItemSchema.parse(valid)
    expect(result.value).toBe('Mix flour and water')
  })

  it('should trim whitespace from value', () => {
    const withWhitespace = { value: '  Mix flour and water  ' }
    const result = InstructionItemSchema.parse(withWhitespace)
    expect(result.value).toBe('Mix flour and water')
  })

  it('should reject empty instruction value', () => {
    const empty = { value: '' }
    expect(() => InstructionItemSchema.parse(empty)).toThrow(
      'Instruction value cannot be empty',
    )
  })

  it('should reject missing value', () => {
    const missing = {}
    expect(() => InstructionItemSchema.parse(missing)).toThrow(
      'Instruction value must be a string',
    )
  })
})

describe('InstructionGroupSchema', () => {
  it('should validate a valid instruction group', () => {
    const valid = {
      name: 'For the dough',
      items: [{ value: 'Mix ingredients' }, { value: 'Knead dough' }],
    }
    const result = InstructionGroupSchema.parse(valid)
    expect(result.name).toBe('For the dough')
    expect(result.items).toHaveLength(2)
  })

  it('should accept null name for ungrouped instructions', () => {
    const ungrouped = {
      name: null,
      items: [{ value: 'Mix ingredients' }],
    }
    const result = InstructionGroupSchema.parse(ungrouped)
    expect(result.name).toBeNull()
  })

  it('should reject group with empty items array', () => {
    const empty = {
      name: 'Test',
      items: [],
    }
    expect(() => InstructionGroupSchema.parse(empty)).toThrow(
      'Instruction group must have at least one item',
    )
  })
})

describe('InstructionsSchema', () => {
  it('should validate valid instructions with one group', () => {
    const valid = [
      {
        name: null,
        items: [{ value: 'Mix ingredients' }, { value: 'Bake' }],
      },
    ]
    const result = InstructionsSchema.parse(valid)
    expect(result).toHaveLength(1)
    expect(result[0].items).toHaveLength(2)
  })

  it('should validate valid instructions with multiple groups', () => {
    const valid = [
      {
        name: 'For the dough',
        items: [{ value: 'Mix flour and water' }],
      },
      {
        name: 'Assembly',
        items: [{ value: 'Shape the dough' }],
      },
    ]
    const result = InstructionsSchema.parse(valid)
    expect(result).toHaveLength(2)
  })

  it('should reject empty instructions array', () => {
    const empty: unknown[] = []
    expect(() => InstructionsSchema.parse(empty)).toThrow(
      'Recipe must have at least one instruction group',
    )
  })

  it('should reject instructions with no actual steps', () => {
    const noSteps = [
      {
        name: 'Test',
        items: [],
      },
    ]
    expect(() => InstructionsSchema.parse(noSteps)).toThrow()
  })
})

describe('LinkSchema', () => {
  it('should validate a valid link', () => {
    const valid = {
      href: 'https://example.com/recipe',
      text: 'Recipe Link',
    }
    const result = LinkSchema.parse(valid)
    expect(result.href).toBe('https://example.com/recipe')
    expect(result.text).toBe('Recipe Link')
  })

  it('should reject invalid URL', () => {
    const invalid = {
      href: 'not-a-url',
      text: 'Invalid',
    }
    expect(() => LinkSchema.parse(invalid)).toThrow(
      'Link href must be a valid URL',
    )
  })
})

describe('RecipeObjectSchema', () => {
  const validRecipe = {
    host: 'example.com',
    title: 'Chocolate Chip Cookies',
    author: 'John Doe',
    canonicalUrl: 'https://example.com/cookies',
    image: 'https://example.com/image.jpg',
    language: 'en',
    yields: '24 cookies',
    description: 'Delicious homemade chocolate chip cookies',
    ingredients: [
      {
        name: null,
        items: [{ value: '2 cups flour' }, { value: '1 cup sugar' }],
      },
    ],
    instructions: [
      {
        name: null,
        items: [{ value: 'Mix ingredients' }, { value: 'Bake at 350F' }],
      },
    ],
    totalTime: 45,
    cookTime: 30,
    prepTime: 15,
    ratings: 4.5,
    ratingsCount: 100,
    siteName: null,
    cookingMethod: null,
    category: ['Dessert'],
    cuisine: ['American'],
    keywords: ['cookies', 'dessert'],
    dietaryRestrictions: [],
    equipment: ['Mixing bowl', 'Oven'],
    links: [{ href: 'https://example.com/tips', text: 'Baking Tips' }],
    nutrients: { calories: '200 kcal' },
    reviews: {},
  }

  it('should validate a complete valid recipe', () => {
    const result = RecipeObjectSchema.parse(validRecipe)
    expect(result.title).toBe('Chocolate Chip Cookies')
    expect(result.author).toBe('John Doe')
    expect(result.totalTime).toBe(45)
  })

  it('should trim whitespace from title', () => {
    const recipe = {
      ...validRecipe,
      title: '  Chocolate Chip Cookies  ',
    }
    const result = RecipeObjectSchema.parse(recipe)
    expect(result.title).toBe('Chocolate Chip Cookies')
  })

  it('should reject invalid host URL', () => {
    const recipe = { ...validRecipe, host: 'http://localhost' }
    expect(() => RecipeObjectSchema.parse(recipe)).toThrow(
      'Host must be a valid hostname',
    )
  })

  it('should reject empty title', () => {
    const recipe = { ...validRecipe, title: '' }
    expect(() => RecipeObjectSchema.parse(recipe)).toThrow(
      'Title cannot be empty',
    )
  })

  it('should reject title exceeding 500 characters', () => {
    const recipe = { ...validRecipe, title: 'a'.repeat(501) }
    expect(() => RecipeObjectSchema.parse(recipe)).toThrow(
      'Title must be less than 500 characters',
    )
  })

  it('should reject invalid canonical URL', () => {
    const recipe = { ...validRecipe, canonicalUrl: 'not-a-url' }
    expect(() => RecipeObjectSchema.parse(recipe)).toThrow(
      'Canonical URL must be a valid URL',
    )
  })

  it('should reject invalid image URL', () => {
    const recipe = { ...validRecipe, image: 'not-a-url' }
    expect(() => RecipeObjectSchema.parse(recipe)).toThrow(
      'Image must be a valid URL',
    )
  })

  it('should reject negative time values', () => {
    const recipe = { ...validRecipe, totalTime: -10 }
    expect(() => RecipeObjectSchema.parse(recipe)).toThrow(
      'Total time must be positive',
    )
  })

  it('should accept null time values', () => {
    const recipe = {
      ...validRecipe,
      totalTime: null,
      cookTime: null,
      prepTime: null,
    }
    const result = RecipeObjectSchema.parse(recipe)
    expect(result.totalTime).toBeNull()
    expect(result.cookTime).toBeNull()
    expect(result.prepTime).toBeNull()
  })

  it('should reject ratings below 0', () => {
    const recipe = { ...validRecipe, ratings: -1 }
    expect(() => RecipeObjectSchema.parse(recipe)).toThrow(
      'Ratings must be at least 0',
    )
  })

  it('should reject ratings above 5', () => {
    const recipe = { ...validRecipe, ratings: 6 }
    expect(() => RecipeObjectSchema.parse(recipe)).toThrow(
      'Ratings must be at most 5',
    )
  })

  it('should reject negative ratingsCount', () => {
    const recipe = { ...validRecipe, ratingsCount: -1 }
    expect(() => RecipeObjectSchema.parse(recipe)).toThrow(
      'Ratings count must be non-negative',
    )
  })

  it('should reject non-integer ratingsCount', () => {
    const recipe = { ...validRecipe, ratingsCount: 10.5 }
    expect(() => RecipeObjectSchema.parse(recipe)).toThrow(
      'Ratings count must be an integer',
    )
  })

  it('should apply default values for optional arrays', () => {
    const recipe = {
      host: 'example.com',
      title: 'Test Recipe',
      author: 'Test Author',
      canonicalUrl: 'https://example.com/test',
      image: 'https://example.com/img.jpg',
      language: 'en',
      yields: '4 servings',
      description: 'A test recipe',
      ingredients: [{ name: null, items: [{ value: 'flour' }] }],
      instructions: [{ name: null, items: [{ value: 'mix' }] }],
      totalTime: null,
      cookTime: null,
      prepTime: null,
      siteName: null,
      cookingMethod: null,
      links: [],
      nutrients: {},
      reviews: {},
    }
    const result = RecipeObjectSchema.parse(recipe)
    expect(result.category).toEqual([])
    expect(result.cuisine).toEqual([])
    expect(result.keywords).toEqual([])
    expect(result.dietaryRestrictions).toEqual([])
    expect(result.equipment).toEqual([])
    expect(result.ratings).toBe(0)
    expect(result.ratingsCount).toBe(0)
  })

  it('should reject when totalTime is less than cookTime + prepTime', () => {
    const recipe = {
      ...validRecipe,
      totalTime: 30,
      cookTime: 20,
      prepTime: 15,
    }
    expect(() => RecipeObjectSchema.parse(recipe)).toThrow(
      'Total time should be at least the sum of cook time and prep time',
    )
  })

  it('should accept when totalTime equals cookTime + prepTime', () => {
    const recipe = {
      ...validRecipe,
      totalTime: 35,
      cookTime: 20,
      prepTime: 15,
    }
    const result = RecipeObjectSchema.parse(recipe)
    expect(result.totalTime).toBe(35)
  })

  it('should accept when totalTime is greater than cookTime + prepTime', () => {
    const recipe = {
      ...validRecipe,
      totalTime: 50,
      cookTime: 20,
      prepTime: 15,
    }
    const result = RecipeObjectSchema.parse(recipe)
    expect(result.totalTime).toBe(50)
  })

  it('should skip totalTime validation when any time is null', () => {
    const recipe = {
      ...validRecipe,
      totalTime: 10,
      cookTime: null,
      prepTime: 15,
    }
    const result = RecipeObjectSchema.parse(recipe)
    expect(result.totalTime).toBe(10)
  })

  it('should reject ratings > 0 with ratingsCount = 0', () => {
    const recipe = {
      ...validRecipe,
      ratings: 4.5,
      ratingsCount: 0,
    }
    expect(() => RecipeObjectSchema.parse(recipe)).toThrow(
      'Ratings count should be greater than 0 when ratings exist',
    )
  })

  it('should accept ratings = 0 with ratingsCount = 0', () => {
    const recipe = {
      ...validRecipe,
      ratings: 0,
      ratingsCount: 0,
    }
    const result = RecipeObjectSchema.parse(recipe)
    expect(result.ratings).toBe(0)
    expect(result.ratingsCount).toBe(0)
  })

  it('should accept ratings > 0 with ratingsCount > 0', () => {
    const recipe = {
      ...validRecipe,
      ratings: 4.5,
      ratingsCount: 10,
    }
    const result = RecipeObjectSchema.parse(recipe)
    expect(result.ratings).toBe(4.5)
    expect(result.ratingsCount).toBe(10)
  })

  it('should reject empty arrays items in lists', () => {
    const recipe = {
      ...validRecipe,
      category: ['Valid', ''],
    }
    expect(() => RecipeObjectSchema.parse(recipe)).toThrow(
      'Category item cannot be empty',
    )
  })

  it('should validate all link objects', () => {
    const recipe = {
      ...validRecipe,
      links: [
        { href: 'https://example.com/1', text: 'Link 1' },
        { href: 'https://example.com/2', text: 'Link 2' },
      ],
    }
    const result = RecipeObjectSchema.parse(recipe)
    expect(result.links).toHaveLength(2)
  })

  it('should reject invalid links in array', () => {
    const recipe = {
      ...validRecipe,
      links: [{ href: 'not-a-url', text: 'Invalid' }],
    }
    expect(() => RecipeObjectSchema.parse(recipe)).toThrow()
  })
})

describe('Schema type inference', () => {
  it('should infer correct types from strict schema', () => {
    const recipe = RecipeObjectSchema.parse({
      host: 'example.com',
      title: 'Test',
      author: 'Author',
      canonicalUrl: 'https://example.com/test',
      image: 'https://example.com/img.jpg',
      language: 'en',
      yields: '4',
      description: 'Test description',
      ingredients: [{ name: null, items: [{ value: 'flour' }] }],
      instructions: [{ name: null, items: [{ value: 'mix' }] }],
      totalTime: null,
      cookTime: null,
      prepTime: null,
      siteName: null,
      cookingMethod: null,
      category: [],
      cuisine: [],
      keywords: [],
      dietaryRestrictions: [],
      equipment: [],
      links: [],
      nutrients: {},
      reviews: {},
      ratings: 0,
      ratingsCount: 0,
    })

    expectTypeOf(recipe).toEqualTypeOf<RecipeObject>()
  })
})
