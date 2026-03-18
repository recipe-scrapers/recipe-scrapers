import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { ParseIngredientOptions } from 'parse-ingredient'
import type { ExtractorPlugin } from '@/abstract-extractor-plugin'
import type { PostProcessorPlugin } from '@/abstract-postprocessor-plugin'
import type { LogLevel } from '@/logger'
import type { RecipeObject } from './recipe.interface'

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
   * Whether link scraping is enabled.
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
   */
  parseIngredients?: boolean | ParseIngredientOptions
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
