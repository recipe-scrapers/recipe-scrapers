import { describe, expect, it } from 'bun:test'

import {
  ExtractionFailedException,
  ExtractionRuntimeException,
  ExtractorNotFoundException,
} from '@/exceptions'
import { createSafeParseFailure } from '@/safe-parse-result'

describe('createSafeParseFailure', () => {
  it('normalizes validation issue paths and preserves their cause', () => {
    const cause = new Error('Schema failed')
    const result = createSafeParseFailure({
      type: 'validation',
      issues: [
        {
          message: 'Ingredient is required',
          path: [{ key: 'ingredients' }, 0, { key: 'value' }],
        },
      ],
      cause,
    })

    expect(result).toEqual({
      success: false,
      error: {
        type: 'validation',
        code: 'validation_failed',
        issues: [
          {
            message: 'Ingredient is required',
            path: ['ingredients', 0, 'value'],
            dotPath: 'ingredients.0.value',
          },
        ],
        cause,
        context: undefined,
      },
    })
  })

  it('maps a missing extractor with field context', () => {
    const error = new ExtractorNotFoundException('author')

    expect(createSafeParseFailure({ type: 'extraction', error })).toEqual({
      success: false,
      error: {
        type: 'extraction',
        code: 'extractor_not_found',
        context: { field: 'author' },
        issues: [
          {
            message: error.message,
            path: ['author'],
            dotPath: 'author',
          },
        ],
        cause: error,
      },
    })
  })

  it('maps an extraction runtime error with source and underlying cause', () => {
    const cause = new RangeError('Invalid duration')
    const error = new ExtractionRuntimeException('totalTime', 'plugin "SchemaOrgPlugin"', cause)

    expect(createSafeParseFailure({ type: 'extraction', error })).toEqual({
      success: false,
      error: {
        type: 'extraction',
        code: 'extraction_runtime_error',
        context: {
          field: 'totalTime',
          source: 'plugin "SchemaOrgPlugin"',
        },
        issues: [
          {
            message: error.message,
            path: ['totalTime'],
            dotPath: 'totalTime',
          },
        ],
        cause,
      },
    })
  })

  it('maps an extraction failure with field context', () => {
    const error = new ExtractionFailedException('ingredients')

    const result = createSafeParseFailure({ type: 'extraction', error })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('extraction_failed')
      expect(result.error.context).toEqual({ field: 'ingredients' })
      expect(result.error.issues[0]?.path).toEqual(['ingredients'])
      expect(result.error.issues[0]?.dotPath).toBe('ingredients')
      expect(result.error.cause).toBe(error)
    }
  })

  it('maps an unknown extraction error without field context', () => {
    const error = new Error('Extraction exploded')

    expect(createSafeParseFailure({ type: 'extraction', error })).toEqual({
      success: false,
      error: {
        type: 'extraction',
        code: 'extraction_failed',
        issues: [{ message: 'Extraction exploded' }],
        cause: error,
      },
    })
  })
})
