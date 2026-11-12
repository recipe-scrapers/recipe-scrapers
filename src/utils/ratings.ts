import type { RecipeFields } from '@/types/recipe.interface'

export type RecipeRatings = Pick<RecipeFields, 'ratings' | 'ratingsCount'>

/**
 * Drops a rating that has no ratings count behind it. Some sites publish a
 * placeholder average with a count of 0, and others publish an average with
 * no count at all; neither can be trusted as a real rating.
 *
 * @param ratings - The extracted average rating and ratings count
 * @returns Ratings where a non-zero rating always has a non-zero count
 */
export function reconcileRecipeRatings(ratings: RecipeRatings): RecipeRatings {
  if (ratings.ratings > 0 && ratings.ratingsCount === 0) {
    return { ratings: 0, ratingsCount: 0 }
  }

  return ratings
}
