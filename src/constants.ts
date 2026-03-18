import type {
  OptionalRecipeFields,
  RecipeFields,
} from './types/recipe.interface'

// Default values for optional recipe fields
const OPTIONAL_RECIPE_FIELD_DEFAULT_VALUES = {
  siteName: null,
  category: new Set<string>(),
  cookTime: null,
  prepTime: null,
  totalTime: null,
  cuisine: new Set<string>(),
  cookingMethod: null,
  ratings: 0,
  ratingsCount: 0,
  equipment: new Set<string>(),
  reviews: new Map<string, string>(),
  nutrients: new Map<string, string>(),
  dietaryRestrictions: new Set<string>(),
  keywords: new Set<string>(),
  notes: undefined,
} as const satisfies OptionalRecipeFields

type OptionalRecipeFieldDefaultValues =
  typeof OPTIONAL_RECIPE_FIELD_DEFAULT_VALUES

type OptionalRecipeFieldWithDefault = keyof OptionalRecipeFieldDefaultValues

export function isOptionalRecipeField(
  field: keyof RecipeFields,
): field is OptionalRecipeFieldWithDefault {
  return field in OPTIONAL_RECIPE_FIELD_DEFAULT_VALUES
}

export function getOptionalRecipeFieldDefault<
  Key extends OptionalRecipeFieldWithDefault,
>(field: Key): OptionalRecipeFieldDefaultValues[Key] {
  const value = OPTIONAL_RECIPE_FIELD_DEFAULT_VALUES[field]

  if (value instanceof Set) {
    return new Set(value) as OptionalRecipeFieldDefaultValues[Key]
  }

  if (value instanceof Map) {
    return new Map(value) as OptionalRecipeFieldDefaultValues[Key]
  }

  return value
}
