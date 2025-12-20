import * as cheerio from 'cheerio'
import type z from 'zod'
import type { RecipeObjectValidated } from '@/schemas/recipe.schema'
import { RecipeObjectSchema } from '@/schemas/recipe.schema'
import type { ExtractorPlugin } from './abstract-extractor-plugin'
import type { PostProcessorPlugin } from './abstract-postprocessor-plugin'
import { NotImplementedException } from './exceptions'
import { Logger, LogLevel } from './logger'
import { PluginManager } from './plugin-manager'
import { HtmlStripperPlugin } from './plugins/html-stripper.processor'
import { OpenGraphPlugin } from './plugins/opengraph.extractor'
import { SchemaOrgPlugin } from './plugins/schema-org.extractor'
import { RecipeExtractor } from './recipe-extractor'
import type {
  RecipeData,
  RecipeFields,
  RecipeObject,
} from './types/recipe.interface'
import type { ScraperOptions } from './types/scraper.interface'

export abstract class AbstractScraper {
  protected readonly logger: Logger
  protected readonly pluginManager: PluginManager
  protected readonly recipeExtractor: RecipeExtractor

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
    } = options

    this.logger = new Logger(this.constructor.name, logLevel)
    this.$ = cheerio.load(html)

    const baseExtractors: ExtractorPlugin[] = [
      new OpenGraphPlugin(this.$),
      new SchemaOrgPlugin(this.$, logLevel),
    ]
    const basePostProcessors: PostProcessorPlugin[] = [new HtmlStripperPlugin()]

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
  abstract extractors: {
    [K in keyof RecipeFields]?: (
      prevValue: RecipeFields[K] | undefined,
    ) => RecipeFields[K] | Promise<RecipeFields[K]>
  }

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
    if (!this.options.linksEnabled) return []

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
    const instance = this.constructor as typeof AbstractScraper

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
      host: instance.host(),
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
   */
  public async toRecipeObject(): Promise<RecipeObject> {
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
   * Get the Zod schema to use for validation.
   * Subclasses can override to provide custom schemas.
   */
  protected getSchema() {
    return RecipeObjectSchema
  }

  /**
   * Extract and validate recipe data.
   * Throws ZodError if validation fails.
   *
   * @returns Validated recipe object
   * @throws {ZodError} If validation fails
   */
  async parse(): Promise<RecipeObjectValidated> {
    const raw = await this.toRecipeObject()
    const schema = this.getSchema()
    return schema.parse(raw)
  }

  /**
   * Extract and validate recipe data without throwing.
   * Returns a result object indicating success or failure.
   *
   * @returns Result object with either data or error
   */
  async safeParse(): Promise<z.ZodSafeParseResult<RecipeObjectValidated>> {
    const raw = await this.toRecipeObject()
    const schema = this.getSchema()
    return schema.safeParse(raw)
  }
}
