import { describe, expect, it } from 'bun:test'

import {
  ExtractorNotFoundException,
  NotImplementedException,
  UnsupportedFieldException,
  ValidationException,
} from '../index'

describe('ExtractorNotFoundException', () => {
  it('should create error with correct message and name', () => {
    const field = 'ingredients'
    const error = new ExtractorNotFoundException(field)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ExtractorNotFoundException)
    expect(error.message).toBe('No extractor found for field: ingredients')
    expect(error.name).toBe('ExtractorNotFoundException')
  })
})

describe('NotImplementedException', () => {
  it('should create error with correct message and name', () => {
    const method = 'extractIngredients'
    const error = new NotImplementedException(method)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(NotImplementedException)
    expect(error.message).toBe(
      'Method should be implemented: extractIngredients',
    )
    expect(error.name).toBe('NotImplementedException')
  })
})

describe('UnsupportedFieldException', () => {
  it('should create error with correct message and name', () => {
    const field = 'rating'
    const error = new UnsupportedFieldException(field)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(UnsupportedFieldException)
    expect(error.message).toBe('Extraction not supported for field: rating')
    expect(error.name).toBe('UnsupportedFieldException')
  })
})

describe('ValidationException', () => {
  it('should create error with issues and name', () => {
    const error = new ValidationException([
      { message: 'Invalid title', path: ['title'] },
    ])

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ValidationException)
    expect(error.name).toBe('ValidationException')
    expect(error.message).toBe('Recipe validation failed')
    expect(error.issues).toEqual([
      { message: 'Invalid title', path: ['title'] },
    ])
  })
})
