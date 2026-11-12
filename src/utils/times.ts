import type { RecipeFields } from '@/types/recipe.interface'

export type RecipeTimes = Pick<RecipeFields, 'totalTime' | 'cookTime' | 'prepTime'>

/**
 * Repairs published recipe times where cook time plus prep time is longer
 * than the total time. The total time is treated as the trustworthy value.
 *
 * - When the cook time equals the total, the site most likely copied the
 *   total into it, so the cook time becomes the total minus the prep time.
 * - When the prep time equals the total, the prep time becomes the total
 *   minus the cook time.
 * - Any other mismatch cannot be resolved, so the cook and prep times are
 *   dropped and only the total is kept.
 *
 * Consistent times, or times with any value missing, are returned unchanged.
 *
 * @param times - The extracted total, cook, and prep times in minutes
 * @returns Times where cook plus prep never exceeds the total
 */
export function reconcileRecipeTimes(times: RecipeTimes): RecipeTimes {
  const { totalTime, cookTime, prepTime } = times

  if (totalTime === null || cookTime === null || prepTime === null) {
    return times
  }

  if (cookTime + prepTime <= totalTime) {
    return times
  }

  if (cookTime === totalTime && prepTime < totalTime) {
    return { totalTime, cookTime: totalTime - prepTime, prepTime }
  }

  if (prepTime === totalTime && cookTime < totalTime) {
    return { totalTime, cookTime, prepTime: totalTime - cookTime }
  }

  return { totalTime, cookTime: null, prepTime: null }
}
