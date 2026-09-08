import { z } from 'zod'

const MAX_STRING_LENGTH = 5000

/**
 * Helper to create a required, non-empty string field
 * Note: Returns the base ZodString so additional methods can be chained
 */
export const zString = (fieldName: string, { min = 1, max = 0 } = {}) => {
  const maxLength = max > 0 ? max : MAX_STRING_LENGTH

  return z
    .string(`${fieldName} must be a string`)
    .min(min, `${fieldName} cannot be empty`)
    .max(maxLength, `${fieldName} must be less than ${maxLength} characters`)
    .transform((s) => s.trim())
}

/**
 * Helper to create a URL string field
 */
export const zHttpUrl = (fieldName: string) => z.httpUrl(`${fieldName} must be a valid URL`)

/**
 * Helper to create a positive integer field
 */
export const zPositiveInteger = (fieldName: string) =>
  z.int(`${fieldName} must be an integer`).positive(`${fieldName} must be positive`).nullable()

export const zNonEmptyArray = <T extends z.ZodType>(schema: T, fieldName: string) =>
  z
    .array(schema, `${fieldName} items must be an array`)
    .min(1, `${fieldName} group must have at least one item`)
