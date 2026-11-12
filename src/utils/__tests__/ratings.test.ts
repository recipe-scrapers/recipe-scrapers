import { describe, expect, it } from 'bun:test'

import { reconcileRecipeRatings } from '../ratings'

describe('reconcileRecipeRatings', () => {
  it('keeps a rating that has a count', () => {
    expect(reconcileRecipeRatings({ ratings: 4.5, ratingsCount: 12 })).toEqual({
      ratings: 4.5,
      ratingsCount: 12,
    })
  })

  it('keeps an unrated recipe unchanged', () => {
    expect(reconcileRecipeRatings({ ratings: 0, ratingsCount: 0 })).toEqual({
      ratings: 0,
      ratingsCount: 0,
    })
  })

  it('drops a rating with no count', () => {
    expect(reconcileRecipeRatings({ ratings: 4, ratingsCount: 0 })).toEqual({
      ratings: 0,
      ratingsCount: 0,
    })
  })
})
