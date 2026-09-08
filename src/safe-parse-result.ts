import type { StandardSchemaV1 } from '@standard-schema/spec'
import { getDotPath } from '@standard-schema/utils'

import {
  ExtractionFailedException,
  ExtractionRuntimeException,
  ExtractorNotFoundException,
} from './exceptions'
import { isNumber, isPlainObject, isString, resolveErrorMessage } from './utils'

/**
 * A normalized validation issue used across supported schema libraries.
 */
export type ValidationIssue = StandardSchemaV1.Issue & {
  dotPath?: string | null
}

export type SafeParseErrorType = 'validation' | 'extraction'

export type SafeParseErrorCode =
  | 'validation_failed'
  | 'extractor_not_found'
  | 'extraction_runtime_error'
  | 'extraction_failed'

export interface SafeParseErrorContext {
  field?: string
  source?: string
}

/**
 * Validation error payload returned by `safeParse`.
 */
export interface SafeParseError {
  type: SafeParseErrorType
  code: SafeParseErrorCode
  issues: ReadonlyArray<ValidationIssue>
  cause?: unknown
  context?: SafeParseErrorContext
}

/**
 * Library-agnostic safe parse result.
 */
export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: SafeParseError }

export type SafeParseFailure =
  | {
      type: 'validation'
      issues: readonly StandardSchemaV1.Issue[]
      cause?: unknown
    }
  | { type: 'extraction'; error: unknown }

const isValidationPathSegment = (value: unknown): value is PropertyKey => {
  return isString(value) || isNumber(value) || typeof value === 'symbol'
}

const isStandardSchemaPathSegment = (value: unknown): value is StandardSchemaV1.PathSegment => {
  return isPlainObject(value) && 'key' in value && isValidationPathSegment(value.key)
}

const normalizeIssuePath = (path?: ReadonlyArray<PropertyKey | StandardSchemaV1.PathSegment>) => {
  if (!path) return undefined

  const normalizedPath: PropertyKey[] = []

  for (const part of path) {
    if (isValidationPathSegment(part)) {
      normalizedPath.push(part)
    } else if (isStandardSchemaPathSegment(part)) {
      normalizedPath.push(part.key)
    }
  }

  return normalizedPath.length > 0 ? normalizedPath : undefined
}

const createValidationFailure = (
  issues: readonly StandardSchemaV1.Issue[],
  cause?: unknown,
): SafeParseResult<never> => ({
  success: false,
  error: {
    type: 'validation',
    code: 'validation_failed',
    issues: issues.map((issue) => ({
      message: issue.message,
      path: normalizeIssuePath(issue.path),
      dotPath: getDotPath(issue),
    })),
    cause,
    context: undefined,
  },
})

const createExtractionFailure = (error: unknown): SafeParseResult<never> => {
  if (error instanceof ExtractorNotFoundException) {
    return {
      success: false,
      error: {
        type: 'extraction',
        code: 'extractor_not_found',
        context: { field: error.field },
        issues: [
          {
            message: error.message,
            path: [error.field],
            dotPath: error.field,
          },
        ],
        cause: error,
      },
    }
  }

  if (error instanceof ExtractionRuntimeException) {
    return {
      success: false,
      error: {
        type: 'extraction',
        code: 'extraction_runtime_error',
        context: { field: error.field, source: error.source },
        issues: [
          {
            message: error.message,
            path: [error.field],
            dotPath: error.field,
          },
        ],
        cause: error.extractionCause ?? error,
      },
    }
  }

  if (error instanceof ExtractionFailedException) {
    return {
      success: false,
      error: {
        type: 'extraction',
        code: 'extraction_failed',
        context: { field: error.field },
        issues: [
          {
            message: error.message,
            path: [error.field],
            dotPath: error.field,
          },
        ],
        cause: error,
      },
    }
  }

  return {
    success: false,
    error: {
      type: 'extraction',
      code: 'extraction_failed',
      issues: [{ message: resolveErrorMessage(error, 'Recipe extraction failed') }],
      cause: error,
    },
  }
}

/**
 * Converts validation or extraction failures into a Safe Parse Result.
 */
export function createSafeParseFailure(failure: SafeParseFailure): SafeParseResult<never> {
  return failure.type === 'validation'
    ? createValidationFailure(failure.issues, failure.cause)
    : createExtractionFailure(failure.error)
}
