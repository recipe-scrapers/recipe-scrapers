import { describe, expect, it } from 'bun:test'

import { zString } from '../common.schema'

describe('zString', () => {
  it('uses the effective default max length in validation messages', () => {
    const schema = zString('Test field')
    const input = 'a'.repeat(5001)

    expect(() => schema.parse(input)).toThrow('Test field must be less than 5000 characters')
  })

  it('uses custom max length in validation messages', () => {
    const schema = zString('Title', { max: 10 })
    const input = 'a'.repeat(11)

    expect(() => schema.parse(input)).toThrow('Title must be less than 10 characters')
  })
})
