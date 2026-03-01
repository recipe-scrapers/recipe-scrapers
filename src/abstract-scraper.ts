import type { StandardSchemaV1 } from '@standard-schema/spec'
import * as cheerio from 'cheerio'
import type { ParseIngredientOptions } from 'parse-ingredient'
import { RecipeObjectSchema } from '@/schemas/recipe.schema'
import type { ExtractorPlugin } from './abstract-extractor-plugin'
import type { PostProcessorPlugin } from './abstract-postprocessor-plugin'
import {
  ExtractionFailedException,
  ExtractionRuntimeException,
  ExtractorNotFoundException,
  NotImplementedException,
  ValidationException,
} from './exceptions'
import { Logger, LogLevel } from './logger'
import { PluginManager } from './plugin-manager'
import { HtmlStripperPlugin } from './plugins/html-stripper.processor'
import { IngredientParserPlugin } from './plugins/ingredient-parser.processor'
import { OpenGraphPlugin } from './plugins/opengraph.extractor'
import { SchemaOrgPlugin } from './plugins/schema-org.extractor'
import { RecipeExtractor } from './recipe-extractor'
import {
  isStandardSchemaV1,
  type SafeParseResult,
  safeParseWithStandardSchema,
} from './schema-adapter'
import type {
  RecipeData,
  RecipeFields,
  RecipeObject,
} from './types/recipe.interface'
import type { ScraperOptions } from './types/scraper.interface'
import { isPlainObject, resolveErrorMessage } from './utils'

export type RecipeFieldExtractor<Key extends keyof RecipeFields> = (
  prevValue: RecipeFields[Key] | undefined,
) => RecipeFields[Key] | Promise<RecipeFields[Key]>

export type ScraperExtractors = {
  [Key in keyof RecipeFields]?: RecipeFieldExtractor<Key>
}

export abstract class AbstractScraper {
  protected readonly logger: Logger
  protected readonly pluginManager: PluginManager
  protected readonly recipeExtractor: RecipeExtractor
  private validationSchema: StandardSchemaV1<unknown, RecipeObject> | null =
    null

  public readonly $: cheerio.CheerioAPI
  public recipeData: RecipeData | null = null

  constructor(
    protected readonly html: string,
    protected readonly url: string,
    protected readonly options: ScraperOptions = {},
  ) {
    const {
      extraExtractors = [],
      extraPostProcessors = [],
      logLevel = LogLevel.WARN,
      parseIngredients = false,
    } = options

    this.logger = new Logger(this.constructor.name, logLevel)
    this.$ = cheerio.load(html)

    const baseExtractors: ExtractorPlugin[] = [
      new OpenGraphPlugin(this.$),
      new SchemaOrgPlugin(this.$, logLevel),
    ]

    const basePostProcessors: PostProcessorPlugin[] = [new HtmlStripperPlugin()]

    // Add ingredient parser if enabled
    if (parseIngredients) {
      const parserOptions: ParseIngredientOptions = isPlainObject(
        parseIngredients,
      )
        ? parseIngredients
        : {}
      basePostProcessors.push(new IngredientParserPlugin(parserOptions))
    }

    this.pluginManager = new PluginManager(
      baseExtractors,
      basePostProcessors,
      extraExtractors,
      extraPostProcessors,
    )

    this.recipeExtractor = new RecipeExtractor(
      this.pluginManager.getExtractors(),
      this.constructor.name,
      { logLevel },
    )
  }

  /**
   * Site-specific extractors (implemented by subclasses)
   * Each extractor is a function that takes the previous value
   * returned by the extractor chain (if any) and returns the field value.
   */
  protected readonly extractors: ScraperExtractors = {}

  /**
   * Main extraction method - tries site-specific first, then plugins,
   * then applies post-processing.
   */
  public async extract<Key extends keyof RecipeFields>(
    field: Key,
  ): Promise<RecipeFields[Key]> {
    // 1. Extract the raw value
    let value = await this.recipeExtractor.extract(
      field,
      this.extractors[field],
    )

    // 2. Apply post-processors
    for (const processor of this.pluginManager.getPostProcessors()) {
      value = await processor.process(field, value)
    }

    return value
  }

  /**
   * Static method to get the host of the scraper.
   * This should be implemented by subclasses to return the specific host.
   */
  static host(): string {
    throw new NotImplementedException('host')
  }

  /**
   * Returns the host value stored in the final recipe data.
   * Subclasses can override when host must be derived from instance context.
   */
  protected getHost(): string {
    const instance = this.constructor as typeof AbstractScraper
    return instance.host()
  }

  /*****************************************************************************
   * Default implementations for common fields that can be overridden
   * by subclasses.
   ****************************************************************************/

  canonicalUrl(): RecipeFields['canonicalUrl'] {
    const canonicalLink = this.$('link[rel="canonical"]').attr('href')

    const base = new URL(
      this.url.startsWith('http') ? this.url : `https://${this.url}`,
    )

    return canonicalLink ? new URL(canonicalLink, base).href : base.href
  }

  language(): RecipeFields['language'] {
    const langAttr = this.$('html').attr('lang')

    if (langAttr) {
      return langAttr
    }

    // Deprecated: check for a meta http-equiv header
    // See: https://www.w3.org/International/questions/qa-http-and-lang
    const metaLang = this.$('meta[http-equiv="content-language"]').attr(
      'content',
    )

    if (metaLang) {
      return metaLang.split(',')[0]
    }

    this.logger.warn('Could not determine language')

    return 'en' // Default to English if not found
  }

  links(): RecipeFields['links'] {
    if (!this.options.linksEnabled) return undefined

    return this.$('a[href]')
      .map((_, el) => {
        const href = this.$(el).attr('href')
        if (!href?.startsWith('http')) return null
        return { href, text: this.$(el).text().trim() }
      })
      .get()
      .filter(Boolean)
  }

  /**
   * Scrape's the recipe and caches the data.
   */
  public async scrape(): Promise<RecipeData> {
    if (this.recipeData) {
      return this.recipeData
    }

    this.recipeData = {
      author: await this.extract('author'),
      canonicalUrl: this.canonicalUrl(),
      category: await this.extract('category'),
      cookTime: await this.extract('cookTime'),
      cookingMethod: await this.extract('cookingMethod'),
      cuisine: await this.extract('cuisine'),
      description: await this.extract('description'),
      dietaryRestrictions: await this.extract('dietaryRestrictions'),
      equipment: await this.extract('equipment'),
      host: this.getHost(),
      image: await this.extract('image'),
      ingredients: await this.extract('ingredients'),
      instructions: await this.extract('instructions'),
      keywords: await this.extract('keywords'),
      language: this.language(),
      links: this.links(),
      nutrients: await this.extract('nutrients'),
      prepTime: await this.extract('prepTime'),
      ratings: await this.extract('ratings'),
      ratingsCount: await this.extract('ratingsCount'),
      reviews: await this.extract('reviews'),
      siteName: await this.extract('siteName'),
      title: await this.extract('title'),
      totalTime: await this.extract('totalTime'),
      yields: await this.extract('yields'),
    }

    return this.recipeData
  }

  /**
   * Converts the scraper's data into a JSON-serializable object.
   * Note: schemaVersion is added during validation by parse() or safeParse().
   */
  public async toRecipeObject(): Promise<Omit<RecipeObject, 'schemaVersion'>> {
    const {
      category,
      cuisine,
      dietaryRestrictions,
      equipment,
      keywords,
      nutrients,
      reviews,
      ...rest
    } = await this.scrape()

    return {
      ...rest,
      category: Array.from(category),
      cuisine: Array.from(cuisine),
      dietaryRestrictions: Array.from(dietaryRestrictions),
      equipment: Array.from(equipment),
      keywords: Array.from(keywords),
      nutrients: Object.fromEntries(nutrients),
      reviews: Object.fromEntries(reviews),
    }
  }

  /**
   * Get the default schema used for validation.
   * Subclasses can override this method to customize the default schema.
   * For custom validation schemas, pass `schema` in options.
   */
  protected getSchema() {
    return RecipeObjectSchema
  }

  /**
   * Resolve the Standard Schema used for validation.
   *
   * Resolution order:
   * 1) `options.schema`
   * 2) default schema from `getSchema()`
   */
  protected getValidationSchema(): StandardSchemaV1<unknown, RecipeObject> {
    if (this.validationSchema) {
      return this.validationSchema
    }

    const schema = this.options.schema ?? this.getSchema()

    if (!isStandardSchemaV1<RecipeObject>(schema)) {
      throw new Error(
        'Validation schema must be Standard Schema v1 compatible.',
      )
    }

    this.validationSchema = schema
    return this.validationSchema
  }

  /**
   * Extract and validate recipe data.
   * Throws ValidationException if validation fails.
   *
   * @returns Validated recipe object
   * @throws {ValidationException} If validation fails
   */
  async parse(): Promise<RecipeObject> {
    const raw = await this.toRecipeObject()
    const result = await safeParseWithStandardSchema(
      this.getValidationSchema(),
      raw,
    )

    if (!result.success) {
      throw new ValidationException(result.error.issues, result.error.cause)
    }

    return result.data
  }

  /**
   * Extract and validate recipe data without throwing.
   * Returns a result object indicating success or failure.
   *
   * @returns Result object with either data or error
   */
  async safeParse(): Promise<SafeParseResult<RecipeObject>> {
    try {
      const raw = await this.toRecipeObject()
      return safeParseWithStandardSchema(this.getValidationSchema(), raw)
    } catch (error) {
      if (error instanceof ExtractorNotFoundException) {
        return {
          success: false,
          error: {
            type: 'extraction',
            code: 'extractor_not_found',
            context: { field: error.field },
            issues: [
              {
                message: error.message,
                path: [error.field],
                dotPath: error.field,
              },
            ],
            cause: error,
          },
        }
      }

      if (error instanceof ExtractionRuntimeException) {
        return {
          success: false,
          error: {
            type: 'extraction',
            code: 'extraction_runtime_error',
            context: { field: error.field, source: error.source },
            issues: [
              {
                message: error.message,
                path: [error.field],
                dotPath: error.field,
              },
            ],
            cause: error.extractionCause ?? error,
          },
        }
      }

      if (error instanceof ExtractionFailedException) {
        return {
          success: false,
          error: {
            type: 'extraction',
            code: 'extraction_failed',
            context: { field: error.field },
            issues: [
              {
                message: error.message,
                path: [error.field],
                dotPath: error.field,
              },
            ],
            cause: error,
          },
        }
      }

      const message = resolveErrorMessage(error, 'Recipe extraction failed')

      return {
        success: false,
        error: {
          type: 'extraction',
          code: 'extraction_failed',
          issues: [{ message }],
          cause: error,
        },
      }
    }
  }
}
