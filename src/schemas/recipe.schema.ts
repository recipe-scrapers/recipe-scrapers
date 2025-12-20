import { z } from 'zod'
import { isNull } from '@/utils'
import {
  zHttpUrl,
  zNonEmptyArray,
  zPositiveNumber,
  zString,
} from './common.schema'

/**
 * Schema for a single ingredient item
 */
export const IngredientItemSchema = z.object({
  value: zString('Ingredient value'),
})

/**
 * Schema for a group of ingredients
 */
export const IngredientGroupSchema = z.object({
  name: zString('Ingredient group name').nullable().default(null),
  items: zNonEmptyArray(IngredientItemSchema, 'Ingredient'),
})

/**
 * Schema for all recipe ingredients
 * Must have at least one group with at least one ingredient
 */
export const IngredientsSchema = z
  .array(IngredientGroupSchema, 'Ingredients must be an array')
  .min(1, 'Recipe must have at least one ingredient group')

/**
 * Schema for a single instruction step
 */
export const InstructionItemSchema = z.object({
  value: zString('Instruction value'),
})

/**
 * Schema for a group of instruction steps
 */
export const InstructionGroupSchema = z.object({
  name: zString('Instruction group name').nullable().default(null),
  items: zNonEmptyArray(InstructionItemSchema, 'Instruction'),
})

/**
 * Schema for all recipe instructions
 * Must have at least one group with at least one step
 */
export const InstructionsSchema = z
  .array(InstructionGroupSchema, 'Instructions must be an array')
  .min(1, 'Recipe must have at least one instruction group')

/**
 * Schema for a link object
 */
export const LinkSchema = z.object({
  href: zHttpUrl('Link href'),
  text: zString('Link text'),
})

/**
 * Base RecipeObject schema without cross-field validations
 * Used as the foundation for both strict and lenient schemas
 */
export const RecipeObjectBaseSchema = z.object({
  // Required fields
  host: z.hostname('Host must be a valid hostname'),

  title: zString('Title', { max: 500 }),

  author: zString('Author', { max: 255 }),

  ingredients: IngredientsSchema,
  instructions: InstructionsSchema,

  // URL fields
  canonicalUrl: zHttpUrl('Canonical URL'),
  image: zHttpUrl('Image'),

  // Time fields (in minutes)
  totalTime: zPositiveNumber('Total time'),
  cookTime: zPositiveNumber('Cook time'),
  prepTime: zPositiveNumber('Prep time'),

  // Ratings
  ratings: z
    .number('Ratings must be a number')
    .min(0, 'Ratings must be at least 0')
    .max(5, 'Ratings must be at most 5')
    .default(0),

  ratingsCount: z
    .int('Ratings count must be an integer')
    .nonnegative('Ratings count must be non-negative')
    .default(0),

  // String fields
  yields: zString('Yields'),
  description: zString('Description'),

  language: zString('Language', { min: 2 }).optional().default('en'),

  siteName: zString('Site name').nullable().default(null),

  cookingMethod: zString('Cooking method').nullable().default(null),

  // List fields
  category: z
    .array(zString('Category item'), 'Category must be an array')
    .default([]),

  cuisine: z
    .array(zString('Cuisine item'), 'Cuisine must be an array')
    .default([]),

  keywords: z
    .array(zString('Keyword item'), 'Keywords must be an array')
    .default([]),

  dietaryRestrictions: z
    .array(
      zString('Dietary restriction item'),
      'Dietary restrictions must be an array',
    )
    .default([]),

  equipment: z
    .array(zString('Equipment item'), 'Equipment must be an array')
    .default([]),

  links: z.array(LinkSchema, 'Links must be an array').default([]),

  // Complex fields
  nutrients: z
    .record(z.string(), z.string(), 'Nutrients must be an object')
    .default({}),

  reviews: z
    .record(z.string(), z.string(), 'Reviews must be an object')
    .default({}),
})

/**
 * Strict RecipeObject schema with all validations enforced
 */
export const RecipeObjectSchema = RecipeObjectBaseSchema.transform((data) => {
  // Auto-fix: calculate totalTime if missing but cook and prep times exist
  if (!data.totalTime && !isNull(data.cookTime) && !isNull(data.prepTime)) {
    data.totalTime = data.cookTime + data.prepTime
  }

  return data
})
  // Cross-field validations
  .refine(
    (data) => {
      const { totalTime, cookTime, prepTime } = data
      if (!isNull(totalTime) && !isNull(cookTime) && !isNull(prepTime)) {
        return totalTime >= cookTime + prepTime
      }
      return true
    },
    {
      message:
        'Total time should be at least the sum of cook time and prep time',
      path: ['totalTime'],
    },
  )
  .refine((data) => data.ratings === 0 || data.ratingsCount > 0, {
    message: 'Ratings count should be greater than 0 when ratings exist',
    path: ['ratingsCount'],
  })

export type RecipeObjectValidated = z.infer<typeof RecipeObjectSchema>
