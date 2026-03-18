import { z } from 'zod'
import { isNull } from '@/utils'
import {
  zHttpUrl,
  zNonEmptyArray,
  zPositiveInteger,
  zString,
} from './common.schema'

/**
 * Current schema version for recipe objects.
 * Increment this when making breaking changes to the schema.
 *
 * Version history:
 * - 1.0.0: Initial schema version
 */
export const RECIPE_SCHEMA_VERSION = '1.0.0' as const

/**
 * Schema for a parsed ingredient from the parse-ingredient library.
 * This represents the structured data extracted from an ingredient string.
 * @see https://github.com/jakeboone02/parse-ingredient
 */
export const ParsedIngredientSchema = z.object({
  /** The primary quantity (the lower quantity in a range, if applicable) */
  quantity: z.number().nullable(),
  /** The secondary quantity (the upper quantity in a range, or null if not
   * applicable) */
  quantity2: z.number().nullable(),
  /** The unit of measure identifier (normalized key) */
  unitOfMeasureID: z.string().nullable(),
  /** The unit of measure as written in the ingredient string */
  unitOfMeasure: z.string().nullable(),
  /** The ingredient description (name of the ingredient) */
  description: z.string(),
  /** Whether the "ingredient" is actually a group header, e.g. "For icing:" */
  isGroupHeader: z.boolean(),
})

/**
 * Schema for a single ingredient item
 */
export const IngredientItemSchema = z.object({
  value: zString('Ingredient value'),
  /**
   * Parsed ingredient data from the parse-ingredient library.
   * Only present when parsing is enabled via `parseIngredients` option.
   */
  parsed: ParsedIngredientSchema.optional().nullable(),
})

/**
 * Schema for a group of ingredients
 */
export const IngredientGroupSchema = z.object({
  name: zString('Ingredient group name').nullable(),
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
  name: zString('Instruction group name').nullable(),
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
 * Schema for a single recipe note
 */
export const NoteItemSchema = z.object({
  value: zString('Note value'),
})

/**
 * Schema for a group of recipe notes
 */
export const NoteGroupSchema = z.object({
  name: zString('Note group name').nullable(),
  items: zNonEmptyArray(NoteItemSchema, 'Note'),
})

/**
 * Schema for all recipe notes
 * Must have at least one group with at least one note
 */
export const NotesSchema = z
  .array(NoteGroupSchema, 'Notes must be an array')
  .min(1, 'Recipe must have at least one note group')

/**
 * Schema for a link object
 */
export const LinkSchema = z.object({
  href: zHttpUrl('Link href'),
  text: zString('Link text'),
})

/**
 * Base RecipeObject schema without cross-field validations.
 * Use this schema when you need to extend the recipe object with custom fields.
 *
 * @example
 * ```ts
 * import { RecipeObjectBaseSchema, applyRecipeValidations } from 'recipe-scrapers-js'
 *
 * const MyCustomRecipeSchema = RecipeObjectBaseSchema.extend({
 *   customField: z.string(),
 * })
 *
 * // Apply the standard recipe validations
 * const MyValidatedRecipeSchema = applyRecipeValidations(MyCustomRecipeSchema)
 * ```
 */
export const RecipeObjectBaseSchema = z.object({
  // Schema version for migrations
  schemaVersion: z
    .literal(RECIPE_SCHEMA_VERSION)
    .default(RECIPE_SCHEMA_VERSION)
    .describe('Schema version for recipe data migrations'),

  // Required fields
  host: z.hostname('Host must be a valid hostname'),

  title: zString('Title', { max: 500 }),

  author: zString('Author', { max: 255 }),

  ingredients: IngredientsSchema,
  instructions: InstructionsSchema,
  notes: NotesSchema.optional(),

  // URL fields
  canonicalUrl: zHttpUrl('Canonical URL'),
  image: zHttpUrl('Image'),

  // Time fields (in minutes)
  totalTime: zPositiveInteger('Total time'),
  cookTime: zPositiveInteger('Cook time'),
  prepTime: zPositiveInteger('Prep time'),

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

  siteName: zString('Site name').nullable(),

  cookingMethod: zString('Cooking method').nullable(),

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

  links: z.array(LinkSchema, 'Links must be an array').optional(),

  // Complex fields
  nutrients: z
    .record(z.string(), z.string(), 'Nutrients must be an object')
    .default({}),

  reviews: z
    .record(z.string(), z.string(), 'Reviews must be an object')
    .default({}),
})

/**
 * Applies recipe-specific transformations and validations to a schema.
 * Use this when extending RecipeObjectBaseSchema with custom fields.
 *
 * @param schema - A Zod object schema that includes
 * all RecipeObjectBaseSchema fields
 * @returns A schema with transforms and field validations applied
 *
 * @example
 * ```ts
 * const CustomSchema = RecipeObjectBaseSchema.extend({
 *   tags: z.array(z.string()),
 * })
 *
 * const ValidatedCustomSchema = applyRecipeValidations(CustomSchema)
 * ```
 */
export function applyRecipeValidations<
  T extends z.infer<typeof RecipeObjectBaseSchema>,
>(schema: z.ZodType<T>) {
  return schema
    .transform((data) => {
      // Auto-fix: calculate totalTime if missing but cook and prep times exist
      if (!data.totalTime && !isNull(data.cookTime) && !isNull(data.prepTime)) {
        data.totalTime = data.cookTime + data.prepTime
      }
      return data
    })
    .refine(
      ({ totalTime, cookTime, prepTime }) => {
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
    .refine(
      (data) => {
        return data.ratings === 0 || data.ratingsCount > 0
      },
      {
        message: 'Ratings count should be greater than 0 when ratings exist',
        path: ['ratingsCount'],
      },
    )
}

/**
 * Strict RecipeObject schema with all validations enforced.
 * This is the standard schema used by recipe scrapers.
 *
 * For custom extensions, use RecipeObjectBaseSchema.extend() and then
 * apply validations with applyRecipeValidations().
 */
export const RecipeObjectSchema = applyRecipeValidations(RecipeObjectBaseSchema)
