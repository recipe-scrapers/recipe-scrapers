import { describe, expect, it } from 'bun:test'

import { reconcileRecipeTimes } from '../times'

describe('reconcileRecipeTimes', () => {
  it('returns consistent times unchanged', () => {
    expect(reconcileRecipeTimes({ totalTime: 50, cookTime: 30, prepTime: 15 })).toEqual({
      totalTime: 50,
      cookTime: 30,
      prepTime: 15,
    })
  })

  it('returns times unchanged when cook plus prep equals the total', () => {
    expect(reconcileRecipeTimes({ totalTime: 45, cookTime: 30, prepTime: 15 })).toEqual({
      totalTime: 45,
      cookTime: 30,
      prepTime: 15,
    })
  })

  it('returns times unchanged when any value is missing', () => {
    expect(reconcileRecipeTimes({ totalTime: 10, cookTime: null, prepTime: 15 })).toEqual({
      totalTime: 10,
      cookTime: null,
      prepTime: 15,
    })
    expect(reconcileRecipeTimes({ totalTime: null, cookTime: 30, prepTime: 15 })).toEqual({
      totalTime: null,
      cookTime: 30,
      prepTime: 15,
    })
  })

  it('derives the cook time when it equals the total', () => {
    expect(reconcileRecipeTimes({ totalTime: 110, cookTime: 110, prepTime: 15 })).toEqual({
      totalTime: 110,
      cookTime: 95,
      prepTime: 15,
    })
  })

  it('derives the prep time when it equals the total', () => {
    expect(reconcileRecipeTimes({ totalTime: 60, cookTime: 12, prepTime: 60 })).toEqual({
      totalTime: 60,
      cookTime: 12,
      prepTime: 48,
    })
  })

  it('drops cook and prep times when all three are equal', () => {
    expect(reconcileRecipeTimes({ totalTime: 30, cookTime: 30, prepTime: 30 })).toEqual({
      totalTime: 30,
      cookTime: null,
      prepTime: null,
    })
  })

  it('drops cook and prep times when neither matches the total', () => {
    expect(reconcileRecipeTimes({ totalTime: 120, cookTime: 90, prepTime: 40 })).toEqual({
      totalTime: 120,
      cookTime: null,
      prepTime: null,
    })
  })
})
