import type { CheerioAPI } from 'cheerio'
import type { AggregateRating } from 'schema-dts'
import { ExtractorPlugin } from '@/abstract-extractor-plugin'
import {
  ExtractionFailedException,
  UnsupportedFieldException,
} from '@/exceptions'
import { Logger, type LogLevel } from '@/logger'
import type { RecipeFields } from '@/types/recipe.interface'
import { isFunction, isNumber, isPlainObject, isString } from '@/utils'
import { stringsToIngredients } from '@/utils/ingredients'
import {
  createInstructionGroup,
  createInstructionItem,
  splitInstructions,
} from '@/utils/instructions'
import { extractRecipeMicrodata } from '@/utils/microdata'
import { parseYields } from '@/utils/parse-yields'
import { normalizeString, parseMinutes, splitToList } from '@/utils/parsing'
import type {
  Person,
  SchemaOrgData,
  Recipe as SchemaRecipe,
  Thing,
} from './schema-org.interface'
import {
  hasId,
  isAggregateRating,
  isBaseType,
  isGraphType,
  isHowToSection,
  isHowToStep,
  isOrganization,
  isPerson,
  isRecipe,
  isSchemaOrgData,
  isThingType,
  isWebPage,
  isWebSite,
} from './type-predicates'

export class SchemaOrgException extends ExtractionFailedException {
  constructor(field: string, value?: unknown) {
    super(field, value)
    this.name = 'SchemaOrgException'
  }
}

export class SchemaOrgPlugin extends ExtractorPlugin {
  name = SchemaOrgPlugin.name

  // High priority - structured data is very reliable
  priority = 90

  private logger: Logger
  private schemaData: SchemaOrgData[] = []
  private recipe: SchemaRecipe = { '@type': 'Recipe' }
  private people: Record<string, Person> = {}
  private ratingsData: Record<string, AggregateRating> = {}
  private websiteName: string | null = null

  private extractors: {
    [K in keyof RecipeFields]?: () => RecipeFields[K]
  } = {
    siteName: this.siteName.bind(this),
    language: this.language.bind(this),
    title: this.title.bind(this),
    author: this.author.bind(this),
    description: this.description.bind(this),
    image: this.image.bind(this),
    ingredients: this.ingredients.bind(this),
    instructions: this.instructions.bind(this),
    category: this.category.bind(this),
    yields: this.yields.bind(this),
    totalTime: this.totalTime.bind(this),
    cookTime: this.cookTime.bind(this),
    prepTime: this.prepTime.bind(this),
    cuisine: this.cuisine.bind(this),
    cookingMethod: this.cookingMethod.bind(this),
    ratings: this.ratings.bind(this),
    ratingsCount: this.ratingsCount.bind(this),
    nutrients: this.nutrients.bind(this),
    keywords: this.keywords.bind(this),
    dietaryRestrictions: this.dietaryRestrictions.bind(this),
  }

  constructor($: CheerioAPI, logLevel?: LogLevel) {
    super($)

    this.logger = new Logger(SchemaOrgPlugin.name, logLevel)
    this.extractJsonLdData()
    this.extractMicrodataData()
    this.processSchemaData()
  }

  supports(field: keyof RecipeFields): boolean {
    return Object.keys(this.extractors).includes(field)
  }

  extract<Key extends keyof RecipeFields>(field: Key): RecipeFields[Key] {
    const extractor = this.extractors[field]

    if (!isFunction(extractor)) {
      throw new UnsupportedFieldException(field)
    }

    return extractor()
  }

  /**
   * Extracts structured JSON-LD data from the page.
   */
  private extractJsonLdData() {
    this.$('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = this.$(el).html()?.trim()

        if (json) {
          const data = JSON.parse(json)

          if (Array.isArray(data)) {
            for (const item of data) {
              if (isSchemaOrgData(item)) {
                this.schemaData.push(item)
              }
            }
          } else if (isSchemaOrgData(data)) {
            this.schemaData.push(data)
          }
        }
      } catch (error) {
        this.logger.warn('Failed to parse JSON-LD', error)
      }
    })
  }

  /**
   * Extracts microdata from the page.
   */
  private extractMicrodataData() {
    const microdataObjects = extractRecipeMicrodata(this.$)

    for (const obj of microdataObjects) {
      this.schemaData.push(obj as SchemaOrgData)
    }
  }

  private pickFromObject(obj: unknown, props: string[]): string | undefined {
    if (!isPlainObject(obj)) return undefined

    for (const prop of props) {
      if (isString(obj[prop])) {
        return obj[prop]
      }
    }

    return undefined
  }

  private getSchemaTextValue<T>(
    value: unknown,
    props: string[] = ['textValue', 'name', 'title', '@id'],
  ): string {
    let text: string | undefined

    if (isString(value)) {
      text = value
    } else if (isNumber(value)) {
      text = value.toString()
    } else if (Array.isArray(value)) {
      text = this.getSchemaTextValue<T>(value[0], props)
    } else {
      text = this.pickFromObject(value, props)
    }

    return normalizeString(text)
  }

  private schemaValueToList(value: unknown) {
    let list: string[] = []

    if (Array.isArray(value)) {
      for (const item of value) {
        const itemValue = this.getSchemaTextValue(item)

        if (itemValue) {
          list.push(itemValue)
        }
      }
    } else if (isString(value)) {
      list = splitToList(this.getSchemaTextValue(value), ',')
    }

    return new Set(list)
  }

  private findEntity<T extends Thing>(
    item: SchemaOrgData,
    schemaType: string,
  ): T | null {
    if (isThingType<T>(item, schemaType)) {
      return item
    }

    if (isGraphType(item)) {
      for (const graphItem of item['@graph']) {
        if (isThingType<T>(graphItem, schemaType)) {
          return graphItem
        }
      }
    }

    return null
  }

  private getIdOrUrl(obj: Thing): string | null {
    return hasId(obj) ? obj['@id'] : isString(obj.url) ? obj.url : null
  }

  private processSchemaData() {
    for (const item of this.schemaData) {
      if (isGraphType(item)) {
        for (const graphItem of item['@graph']) {
          this.processSchemaItem(graphItem)
        }
      } else {
        this.processSchemaItem(item)
      }
    }
  }

  private processSchemaItem(obj: Thing) {
    if (isRecipe(obj)) {
      return this.processRecipe(obj)
    }

    return this.processNonRecipeThing(obj)
  }

  private processRecipe(obj: SchemaRecipe) {
    // @TODO is this needed?
    const recipe = this.findEntity<SchemaRecipe>(obj, 'Recipe')

    this.recipe = { ...this.recipe, ...recipe }
  }

  private processNonRecipeThing(obj: Thing) {
    // Extract website info
    if (isWebSite(obj)) {
      this.websiteName = this.getSchemaTextValue(obj)
    }

    if (isWebPage(obj) && isBaseType(obj.mainEntity)) {
      this.processSchemaItem(obj.mainEntity)
    }

    // Extract person info
    if (isPerson(obj)) {
      const key = this.getIdOrUrl(obj)
      if (key) {
        this.people[key] = obj
      }
    }

    // Extract rating info
    if (isAggregateRating(obj)) {
      const key = obj['@id']
      if (key) {
        this.ratingsData[key] = obj
      }
    }
  }

  private parseDurationField(key: keyof SchemaRecipe): number | null {
    const value = this.recipe[key]

    if (!value) return null

    if (isNumber(value)) {
      this.logger.warn(`Duration field "${key}" is a number: ${value}`)
      return value
    }

    if (isString(value)) {
      return parseMinutes(value)
    }

    // Handle QuantitativeValue objects
    if (isBaseType(value) && 'maxValue' in value) {
      const maxValue = this.getSchemaTextValue(value.maxValue)
      return parseMinutes(maxValue)
    }

    return null
  }

  private parseInstructions(value: unknown): RecipeFields['instructions'] {
    if (isString(value)) {
      const steps = splitInstructions(value)
      return [createInstructionGroup(null, steps.map(createInstructionItem))]
    }

    const instructions: unknown[] = Array.isArray(value)
      ? value.flat()
      : [value].flat()

    const groups: RecipeFields['instructions'] = []

    let currentGroup: { name: string | null; items: string[] } = {
      name: null,
      items: [],
    }

    for (const item of instructions) {
      const name = this.getSchemaTextValue(item, ['name'])
      const text = this.getSchemaTextValue(item, ['text'])

      if (isString(item)) {
        currentGroup.items.push(normalizeString(item))
      } else if (isHowToStep(item)) {
        if (name && text && !text.startsWith(name.replace(/\.$/, ''))) {
          currentGroup.items.push(name)
        }

        if (text) {
          currentGroup.items.push(text)
        }
      } else if (isHowToSection(item)) {
        // Save current group if it has items
        if (currentGroup.items.length > 0) {
          groups.push(
            createInstructionGroup(
              currentGroup.name,
              currentGroup.items.filter(Boolean).map(createInstructionItem),
            ),
          )
        }

        // Start new group with section name
        currentGroup = { name: name || null, items: [] }

        if (item.itemListElement) {
          const nestedResult = this.parseInstructions(item.itemListElement)
          // Merge nested items into current group
          for (const nestedGroup of nestedResult) {
            currentGroup.items.push(...nestedGroup.items.map((i) => i.value))
          }
        }
      } else if (text) {
        currentGroup.items.push(text)
      }
    }

    // Add final group if it has items
    if (currentGroup.items.length > 0) {
      groups.push(
        createInstructionGroup(
          currentGroup.name,
          currentGroup.items.filter(Boolean).map(createInstructionItem),
        ),
      )
    }

    return groups
  }

  /*****************************************************************************
   * Extractor methods
   ****************************************************************************/

  private siteName(): RecipeFields['siteName'] {
    if (isOrganization(this.recipe.publisher)) {
      const publisherName = this.getSchemaTextValue(this.recipe.publisher, [
        'name',
        'alternateName',
      ])

      if (publisherName) {
        return publisherName
      }
    }

    if (!this.websiteName) {
      throw new SchemaOrgException('siteName')
    }

    return this.websiteName
  }

  public language(): RecipeFields['language'] {
    const language = this.getSchemaTextValue(this.recipe.inLanguage)

    if (!language) {
      throw new SchemaOrgException('language')
    }

    return language
  }

  public title(): RecipeFields['title'] {
    const title = this.getSchemaTextValue(this.recipe.name)

    if (!title) {
      throw new SchemaOrgException('title')
    }

    return title
  }

  public author(): RecipeFields['author'] {
    let author: unknown = this.recipe.author

    if (Array.isArray(author) && author.length > 0) {
      author = author[0]
    }

    if (isPlainObject(author)) {
      const key = this.pickFromObject(author, ['@id', 'url'])

      if (key && this.people[key]) {
        author = this.people[key]
      }

      author = (author as { name?: unknown }).name?.toString()
    }

    const authorName = normalizeString(isString(author) ? author : undefined)

    if (!authorName) {
      throw new SchemaOrgException('author')
    }

    return authorName
  }

  public description(): RecipeFields['description'] {
    const desc = this.getSchemaTextValue(this.recipe.description)

    if (!desc) {
      throw new SchemaOrgException('description')
    }

    return desc
  }

  public image(): RecipeFields['image'] {
    const image = this.getSchemaTextValue(this.recipe.image, [
      'url',
      'contentUrl',
    ])

    if (!image.startsWith('http')) {
      throw new SchemaOrgException('image', image)
    }

    return image
  }

  public ingredients(): RecipeFields['ingredients'] {
    const ingredients =
      this.recipe.recipeIngredient ?? this.recipe.ingredients ?? []

    if (!Array.isArray(ingredients)) {
      throw new SchemaOrgException('ingredients', ingredients)
    }

    const flatIngredients = ingredients.flat()

    const uniqueIngredients = new Set<string>()

    for (const item of flatIngredients) {
      const ingredient = this.getSchemaTextValue(item)

      if (ingredient) {
        uniqueIngredients.add(ingredient)
      }
    }

    return stringsToIngredients([...uniqueIngredients])
  }

  public instructions(): RecipeFields['instructions'] {
    const instructions = this.parseInstructions(this.recipe.recipeInstructions)

    if (instructions.length === 0) {
      throw new SchemaOrgException('instructions')
    }

    return instructions
  }

  public category(): RecipeFields['category'] {
    const category = this.recipe.recipeCategory

    if (!category) {
      throw new SchemaOrgException('category')
    }

    return this.schemaValueToList(category)
  }

  public yields(): RecipeFields['yields'] {
    const yields = this.getSchemaTextValue(
      this.recipe.recipeYield ?? this.recipe.yield,
    )

    if (!yields) {
      throw new SchemaOrgException('yields', yields)
    }

    return parseYields(yields)
  }

  public totalTime(): RecipeFields['totalTime'] {
    const totalTime = this.parseDurationField('totalTime')

    if (totalTime) return totalTime

    const prepTime = this.parseDurationField('prepTime') ?? 0
    const cookTime = this.parseDurationField('cookTime') ?? 0

    if (prepTime || cookTime) {
      return prepTime + cookTime
    }

    throw new SchemaOrgException('totalTime')
  }

  public cookTime(): RecipeFields['cookTime'] {
    return this.parseDurationField('cookTime')
  }

  public prepTime(): RecipeFields['prepTime'] {
    return this.parseDurationField('prepTime')
  }

  public cuisine(): RecipeFields['cuisine'] {
    const cuisine = this.recipe.recipeCuisine

    if (!cuisine) {
      throw new SchemaOrgException('cuisine')
    }

    return this.schemaValueToList(cuisine)
  }

  public cookingMethod(): RecipeFields['cookingMethod'] {
    const cookingMethod = this.getSchemaTextValue(this.recipe.cookingMethod)

    if (!cookingMethod) {
      throw new SchemaOrgException('cookingMethod')
    }

    return cookingMethod
  }

  public ratings(): RecipeFields['ratings'] {
    let ratings =
      this.recipe.aggregateRating ??
      this.findEntity(this.recipe, 'AggregateRating') // @TODO needed?

    let ratingValue: string | undefined

    if (isAggregateRating(ratings)) {
      const ratingId = ratings['@id']

      if (ratingId && this.ratingsData[ratingId]) {
        ratings = this.ratingsData[ratingId]
      }

      ratingValue = this.getSchemaTextValue(ratings.ratingValue)
    }

    if (!ratingValue) {
      throw new SchemaOrgException('ratings')
    }

    return Math.round(Number.parseFloat(ratingValue) * 100) / 100
  }

  public ratingsCount(): RecipeFields['ratingsCount'] {
    let ratings =
      this.recipe.aggregateRating ??
      this.findEntity(this.recipe, 'AggregateRating')

    let ratingsCount: string | undefined

    if (isAggregateRating(ratings)) {
      const ratingId = ratings['@id']

      if (ratingId && this.ratingsData[ratingId]) {
        ratings = this.ratingsData[ratingId]
      }

      ratingsCount =
        this.getSchemaTextValue(ratings.ratingCount) ||
        this.getSchemaTextValue(ratings.reviewCount)
    }

    if (!ratingsCount) {
      throw new SchemaOrgException('ratingsCount')
    }

    const count = Number.parseFloat(ratingsCount)
    return count !== 0 ? Math.floor(count) : 0
  }

  public nutrients(): RecipeFields['nutrients'] {
    const nutrients = this.recipe.nutrition

    if (!isPlainObject(nutrients)) {
      throw new SchemaOrgException('nutrients', nutrients)
    }

    const cleanedNutrients = new Map<string, string>()

    for (const [key, value] of Object.entries(nutrients)) {
      if (!key || key.startsWith('@') || !value) continue
      cleanedNutrients.set(key, this.getSchemaTextValue(value))
    }

    return cleanedNutrients
  }

  public keywords(): RecipeFields['keywords'] {
    const keywords = this.recipe.keywords

    if (!keywords) {
      throw new SchemaOrgException('keywords')
    }

    return this.schemaValueToList(keywords)
  }

  public dietaryRestrictions(): RecipeFields['dietaryRestrictions'] {
    const dietaryRestrictions = this.recipe.suitableForDiet

    if (!dietaryRestrictions) {
      throw new SchemaOrgException('dietaryRestrictions')
    }

    const restrictionList = new Set<string>()
    const list = this.schemaValueToList(dietaryRestrictions)

    for (const item of list) {
      const value = item.replace(/^https?:\/\/schema\.org\//, '')
      if (value) {
        restrictionList.add(value)
      }
    }

    return restrictionList
  }
}
