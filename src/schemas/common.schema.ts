import { z } from 'zod'

const MAX_STRING_LENGTH = 5000

/**
 * Helper to create a required, non-empty string field
 * Note: Returns the base ZodString so additional methods can be chained
 */
export const zString = (fieldName: string, { min = 1, max = 0 } = {}) =>
  z
    .string(`${fieldName} must be a string`)
    .min(min, `${fieldName} cannot be empty`)
    .max(
      max > 0 ? max : MAX_STRING_LENGTH,
      `${fieldName} must be less than ${max} characters`,
    )
    .transform((s) => s.trim())

/**
 * Helper to create a URL string field
 */
export const zHttpUrl = (fieldName: string) =>
  z.httpUrl(`${fieldName} must be a valid URL`)

/**
 * Helper to create a positive number field
 */
export const zPositiveNumber = (fieldName: string) =>
  z
    .number(`${fieldName} must be a number`)
    .positive(`${fieldName} must be positive`)
    .nullable()
    .default(null)

export const zNonEmptyArray = <T>(
  schema: z.core.$ZodType<T>,
  fieldName: string,
) =>
  z
    .array(schema, `${fieldName} items must be an array`)
    .min(1, `${fieldName} group must have at least one item`)
