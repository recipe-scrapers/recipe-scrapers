import type { StandardSchemaV1 } from '@standard-schema/spec'

import type { ExtractorPlugin } from '@/abstract-extractor-plugin'
import type { PostProcessorPlugin } from '@/abstract-postprocessor-plugin'
import type { LogLevel } from '@/logger'

import type { IngredientParserOptions } from './ingredient-parser.interface'
import type { RecipeFields, RecipeObject } from './recipe.interface'

export interface ScraperOptions {
  /**
   * Additional extractors to be used by the scraper.
   * These extractors will be added to the default set of extractors.
   * Extractors are applied according to their priority.
   * Higher priority extractors will run first.
   * @default []
   */
  extraExtractors?: ExtractorPlugin[]
  /**
   * Additional post-processors to be used by the scraper.
   * These post-processors will be added to the default set of post-processors.
   * Post-processors are applied after all extractors have run.
   * Post-processors are also applied according to their priority.
   * Higher priority post-processors will run first.
   * @default []
   */
  extraPostProcessors?: PostProcessorPlugin[]
  /**
   * Non-empty value to use when no extractor finds a non-empty author.
   * A function receives the extracted website name, or `null` when unavailable.
   * Extracted author values always take precedence.
   *
   * When omitted, a missing author remains an extraction failure.
   */
  fallbackAuthor?: string | ((siteName: RecipeFields['siteName']) => RecipeFields['author'])
  /**
   * Non-empty value to use when no extractor finds a non-empty description.
   * A function receives the extracted recipe title.
   * Extracted description values always take precedence.
   *
   * When omitted, a missing description remains an extraction failure.
   */
  fallbackDescription?: string | ((title: RecipeFields['title']) => RecipeFields['description'])
  /**
   * Image URL to use when no extractor finds a non-empty image, such as an
   * app placeholder. Extracted image values always take precedence, and the
   * fallback must still pass image URL validation.
   *
   * When omitted, a missing image remains an extraction failure.
   */
  fallbackImage?: string
  /**
   * Non-empty value to use when no extractor can find a recipe yield.
   * Extracted yield values always take precedence.
   *
   * When omitted, a missing yield remains an extraction failure.
   */
  fallbackYield?: string
  /**
   * Whether link extraction is enabled.
   * @default false
   */
  linksEnabled?: boolean
  /**
   * Logging level for the scraper.
   * This controls the verbosity of logs produced by the scraper.
   * @default LogLevel.Warn
   */
  logLevel?: LogLevel
  /**
   * Enable ingredient parsing using the parse-ingredient library.
   * When enabled, each ingredient item will include a `parsed` field
   * containing structured data (quantity, unit, description, etc.).
   *
   * Can be set to `true` to enable with default options, or pass
   * an options object to customize parsing behavior.
   *
   * @see https://github.com/jakeboone02/parse-ingredient
   * @default false
   *
   * @example
   * // Enable with defaults
   * { parseIngredients: true }
   *
   * @example
   * // Enable with custom options
   * { parseIngredients: { normalizeUOM: true } }
   *
   * @example
   * // Include quantity/unit pairs embedded in ingredient descriptions
   * { parseIngredients: { descriptionMeasurements: true } }
   */
  parseIngredients?: boolean | IngredientParserOptions
  /**
   * Enable recipe note parsing from supported HTML recipe blocks.
   * When enabled, recipes may include a `notes` field containing
   * grouped note items when the source markup supports it.
   *
   * @default false
   */
  parseNotes?: boolean
  /**
   * Standard Schema-compatible recipe schema.
   * Use this to validate with libraries such as Zod, Valibot, ArkType, etc.
   */
  schema?: StandardSchemaV1<unknown, RecipeObject>
}
