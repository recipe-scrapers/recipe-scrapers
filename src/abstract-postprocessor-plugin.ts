import type { RecipeFields } from './types/recipe.interface'

export abstract class PostProcessorPlugin {
  /** The name of the plugin */
  abstract name: string

  /** The priority of the plugin */
  abstract priority: number

  abstract shouldProcess(field: keyof RecipeFields): boolean

  abstract process<T>(field: keyof RecipeFields, value: T): T | Promise<T>
}
