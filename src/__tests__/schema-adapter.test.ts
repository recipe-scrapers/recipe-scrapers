import { describe, expect, it } from 'bun:test'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import * as v from 'valibot'
import { z } from 'zod'
import {
  isStandardSchemaV1,
  safeParseWithStandardSchema,
} from '@/schema-adapter'

describe('safeParseWithStandardSchema', () => {
  const schema: StandardSchemaV1<unknown, { title: string }> = {
    '~standard': {
      version: 1,
      vendor: 'test-schema',
      validate(value) {
        if (
          typeof value === 'object' &&
          value !== null &&
          'title' in value &&
          typeof value.title === 'string' &&
          value.title.length > 0
        ) {
          return { value: { title: value.title } }
        }

        return {
          issues: [{ message: 'Title is required', path: ['title'] }],
        }
      },
    },
  }

  it('returns success when schema validates', async () => {
    const result = await safeParseWithStandardSchema(schema, { title: 'Pasta' })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.title).toBe('Pasta')
    }
  })

  it('returns issues when schema rejects data', async () => {
    const result = await safeParseWithStandardSchema(schema, { title: '' })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.type).toBe('validation')
      expect(result.error.code).toBe('validation_failed')
      expect(result.error.issues).toHaveLength(1)
      expect(result.error.issues[0]?.path?.[0]).toBe('title')
      expect(result.error.issues[0]?.message).toBe('Title is required')
      expect(result.error.issues[0]?.dotPath).toBe('title')
    }
  })

  it('returns a generic failure issue when schema throws', async () => {
    const throwingSchema: StandardSchemaV1<unknown, { title: string }> = {
      '~standard': {
        version: 1,
        vendor: 'throwing-schema',
        validate() {
          throw new Error('Thrown issue')
        },
      },
    }

    const result = await safeParseWithStandardSchema(throwingSchema, {})

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('validation')
      expect(result.error.code).toBe('validation_failed')
      expect(result.error.issues[0]?.message).toBe('Thrown issue')
      expect(result.error.issues[0]?.path).toBeUndefined()
      expect(result.error.issues[0]?.dotPath).toBeNull()
    }
  })
})

describe('isStandardSchemaV1', () => {
  it('returns true for Zod schema', () => {
    const schema = z.object({ name: z.string() })
    expect(isStandardSchemaV1(schema)).toBe(true)
  })

  it('returns false for non-standard objects', () => {
    expect(isStandardSchemaV1({})).toBe(false)
    expect(isStandardSchemaV1(null)).toBe(false)
    expect(isStandardSchemaV1({ '~standard': { version: 2 } })).toBe(false)
  })

  it('returns true for Valibot schema', () => {
    const schema = v.object({ name: v.string() })
    expect(isStandardSchemaV1(schema)).toBe(true)
  })
})

describe('valibot interop', () => {
  const schema = v.object({
    title: v.pipe(v.string(), v.minLength(1, 'Title is required')),
  })

  it('validates with a real Valibot schema', async () => {
    const success = await safeParseWithStandardSchema(schema, { title: 'Soup' })
    expect(success.success).toBe(true)

    if (success.success) {
      expect(success.data.title).toBe('Soup')
    }

    const failure = await safeParseWithStandardSchema(schema, { title: '' })
    expect(failure.success).toBe(false)

    if (!failure.success) {
      expect(failure.error.issues[0]?.path?.[0]).toBe('title')
      expect(failure.error.issues[0]?.dotPath).toBe('title')
    }
  })
})

describe('zod error formatting interop', () => {
  it('formats adapter failure results with z.prettifyError', async () => {
    const schema = z.object({
      title: z.string().min(1, 'Title is required'),
    })

    const result = await safeParseWithStandardSchema(schema, { title: '' })

    expect(result.success).toBe(false)

    if (!result.success) {
      const prettyError = z.prettifyError(result.error)

      expect(prettyError).toContain('Title is required')
      expect(prettyError).toContain('title')
    }
  })
})
