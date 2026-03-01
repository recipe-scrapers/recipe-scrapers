import type { StandardSchemaV1 } from '@standard-schema/spec'
import { getDotPath } from '@standard-schema/utils'
import {
  isFunction,
  isNumber,
  isObjectLike,
  isPlainObject,
  isString,
} from '@/utils'

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

const isValidationPathSegment = (value: unknown): value is PropertyKey => {
  return isString(value) || isNumber(value) || typeof value === 'symbol'
}

const isStandardSchemaPathSegment = (
  value: unknown,
): value is StandardSchemaV1.PathSegment => {
  return (
    isPlainObject(value) && 'key' in value && isValidationPathSegment(value.key)
  )
}

const normalizeIssuePath = (
  path?: ReadonlyArray<PropertyKey | StandardSchemaV1.PathSegment>,
) => {
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

const createFailureResult = (
  issues: readonly StandardSchemaV1.Issue[],
  cause?: unknown,
  options?: {
    type?: SafeParseErrorType
    code?: SafeParseErrorCode
    context?: SafeParseErrorContext
  },
): SafeParseResult<never> => {
  return {
    success: false,
    error: {
      type: options?.type ?? 'validation',
      code: options?.code ?? 'validation_failed',
      issues: issues.map((issue) => ({
        message: issue.message,
        path: normalizeIssuePath(issue.path),
        dotPath: getDotPath(issue),
      })),
      cause,
      context: options?.context,
    },
  }
}

const isSuccessResult = <T>(
  result: StandardSchemaV1.Result<T>,
): result is StandardSchemaV1.SuccessResult<T> => {
  return !result.issues
}

/**
 * Runtime check for Standard Schema compatibility.
 */
export function isStandardSchemaV1<Output>(
  value: unknown,
): value is StandardSchemaV1<unknown, Output> {
  if (!isObjectLike(value) || !('~standard' in value)) {
    return false
  }

  const standard = value['~standard']

  return (
    isPlainObject(standard) &&
    standard.version === 1 &&
    isString(standard.vendor) &&
    isFunction(standard.validate)
  )
}

/**
 * Validates input using any Standard Schema-compatible schema.
 */
export async function safeParseWithStandardSchema<T>(
  schema: StandardSchemaV1<unknown, T>,
  value: unknown,
): Promise<SafeParseResult<T>> {
  try {
    const result = await schema['~standard'].validate(value)

    if (isSuccessResult(result)) {
      return { success: true, data: result.value }
    }

    return createFailureResult(result.issues)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Schema validation failed'

    return createFailureResult([{ message }], error)
  }
}
