import type { StandardSchemaV1 } from '@standard-schema/spec'

import { isFunction, isObjectLike, isPlainObject, isString } from '@/utils'

import {
  createSafeParseFailure,
  type SafeParseResult,
} from './safe-parse-result'

export type {
  SafeParseError,
  SafeParseErrorCode,
  SafeParseErrorContext,
  SafeParseErrorType,
  SafeParseResult,
  ValidationIssue,
} from './safe-parse-result'

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

    return createSafeParseFailure({
      type: 'validation',
      issues: result.issues,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Schema validation failed'

    return createSafeParseFailure({
      type: 'validation',
      issues: [{ message }],
      cause: error,
    })
  }
}
