import type { z } from 'zod'
import type {
  IngredientGroupSchema,
  IngredientItemSchema,
  InstructionGroupSchema,
  InstructionItemSchema,
  LinkSchema,
  NoteGroupSchema,
  NoteItemSchema,
  NotesSchema,
  ParsedIngredientSchema,
  RecipeObjectSchema,
} from '@/schemas/recipe.schema'

export type List = Set<string>

/**
 * Parsed ingredient data from the parse-ingredient library
 */
export type ParsedIngredient = z.infer<typeof ParsedIngredientSchema>

/**
 * A single ingredient item
 */
export type IngredientItem = z.infer<typeof IngredientItemSchema>

/**
 * A group of ingredients with an optional group name
 */
export type IngredientGroup = z.infer<typeof IngredientGroupSchema>

/**
 * All recipe ingredients as an array of groups
 */
export type Ingredients = IngredientGroup[]

/**
 * A single instruction step
 */
export type InstructionItem = z.infer<typeof InstructionItemSchema>

/**
 * A group of instruction steps with an optional group name
 */
export type InstructionGroup = z.infer<typeof InstructionGroupSchema>

/**
 * All recipe instructions as an array of groups
 */
export type Instructions = InstructionGroup[]

/**
 * A single recipe note
 */
export type NoteItem = z.infer<typeof NoteItemSchema>

/**
 * A group of recipe notes with an optional group name
 */
export type NoteGroup = z.infer<typeof NoteGroupSchema>

/**
 * All recipe notes as an array of groups
 */
export type Notes = z.infer<typeof NotesSchema>

/**
 * The complete recipe object
 */
export type RecipeObject = z.infer<typeof RecipeObjectSchema>

/**
 * A link with href and display text
 */
export type Link = z.infer<typeof LinkSchema>

export interface RecipeData {
  /**
   * The host name of the website the Scraper class is for.
   * @example 'bbcgoodfood.com'
   */
  host: string
  /**
   * The website name, as defined in the page's HTML.
   * @default null
   */
  siteName: string | null
  /**
   * The author of the recipe. This is typically a person's name
   * but can sometimes be an organization or the name of the website
   * the recipe came from. If the recipe does not explicitly define an author,
   * this should return the name of the website.
   * @example 'Good Food team'
   */
  author: string
  /**
   * The title of the recipe, usually a short sentence or phrase.
   */
  title: string
  /**
   * The URL to the main image associated with the recipe,
   * usually a photograph of the completed recipe.
   */
  image: string
  /**
   * The canonical URL for the scraped recipe.
   * The canonical URL is the direct URL (defined by the website) at which the
   * recipe can be found. This URL will generally not contain any query
   * parameters or fragments, except those required to load the recipe.
   */
  canonicalUrl: string
  /**
   * The language of the recipe page, as defined within the page's HTML.
   * This is typically a two-letter BCP 47 language code, such as 'en' for
   * English or 'de' for German, but may also include the dialect or
   * variation, such as 'en-US' for American English.
   *
   * The language code is based on BCP 47 standards.
   * For a comprehensive list of BCP 47 language codes,
   * refer to this GitHub Gist:
   * @ref https://gist.github.com/typpo/b2b828a35e683b9bf8db91b5404f1bd1
   *
   * @default 'en'
   */
  language: string
  /**
   * An list of all links found in the page HTML defined within an anchor
   * `<a>` element.
   * Only present when `linksEnabled` option is set to `true`.
   */
  links?: Link[]
  /**
   * A description of the recipe. This is normally a sentence or short
   * paragraph describing the recipe. Often the website defines the
   * description, but sometimes it has to be inferred from the page content.
   */
  description: string
  /**
   * The ingredients needed to make the recipe.
   *
   * This is an array of ingredient groups, where each group has a name
   * (e.g., "For the sauce", "For the dough") and a list of ingredient items.
   * When there are no groups, the group name is null.
   *
   * @example
   * [
   *   {
   *     name: 'For the sauce',
   *     items: [
   *       { value: '2 tablespoons olive oil' },
   *       { value: '1 onion, chopped' },
   *     ]
   *   }
   * ]
   */
  ingredients: Ingredients
  /**
   * A list of instructions for preparing the recipe.
   * This is usually a step-by-step guide on how to make the recipe.
   *
   * This is an array of instruction groups, where each group has a name
   * (e.g., "For the sauce", "For assembly") and a list of instruction steps.
   * When there are no groups, the group name is null.
   *
   * @example
   * [
   *   {
   *     name: 'For the dough',
   *     items: [
   *       { value: 'Mix flour and water.' },
   *       { value: 'Knead for 10 minutes.' },
   *     ]
   *   }
   * ]
   */
  instructions: Instructions
  /**
   * Optional recipe notes supplied by the recipe author.
   * This is usually extra guidance, substitutions, or storage tips.
   *
   * This is an array of note groups, where each group has a name
   * and a list of note items. When there are no groups, the group name is null.
   *
   * @example
   * [
   *   {
   *     name: null,
   *     items: [
   *       { value: 'Store in an airtight container for up to 3 weeks.' },
   *     ]
   *   }
   * ]
   */
  notes?: Notes
  /**
   * The category or categories that the recipe belongs to.
   * This can contain a mix of cuisine type (for example, country names),
   * mealtime (breakfast/dinner/etc) and dietary properties (gluten-free,
   * vegetarian). The value is defined by the website, so it may overlap with
   * other fields (e.g. `cuisine`).
   * @default Set()
   * @example ['Italian', 'Vegetarian', 'Dinner']
   */
  category: List
  /**
   * The number of items or servings the recipe will make,
   * including the quantity and unit of the yield.
   * @example '4 servings', '6 items', '12 cookies'.
   */
  yields: string
  /**
   * The total time (in minutes) required to complete the recipe.
   * @example 45
   */
  totalTime: number | null
  /**
   * The time (in minutes) to cook the recipe, excluding any time
   * to prepare the ingredients.
   * @default null
   * @example 30
   */
  cookTime: number | null
  /**
   * The time (in minutes) to prepare the ingredients for the recipe.
   * @default null
   * @example 15
   */
  prepTime: number | null
  /**
   * A list of cuisines that the recipe belongs to.
   * This is a `Set` of strings representing the cuisine types.
   * @example ['Italian', 'Vegetarian']
   */
  cuisine: List
  /**
   * The method of cooking the recipe.
   * @default null
   */
  cookingMethod: string | null
  /**
   * The recipe rating. When available, this is usually the average
   * of all the ratings given to the recipe on the website.
   * @example 4.5
   */
  ratings: number
  /**
   * The total number of ratings contributed to the recipes rating.
   * @example 150
   */
  ratingsCount: number
  /**
   * A list of cooking equipment needed for the recipe.
   * @default Set()
   * @example ['Mixing Bowl', 'Whisk', 'Baking Tray']
   */
  equipment: List
  /**
   * Reviews of the recipe from the website.
   * The keys of the `Map` are the reviewer's name
   * and the values are the review text.
   * @default Map()
   */
  reviews: Map<string, string>
  /**
   * The nutrition information for the recipe.
   * Each nutrition entry is usually given per unit of yield,
   * i.e. per servings, or per item.
   * The keys of the `Map` are the nutrients (including calories)
   * and the values are the amount of that nutrient, including the unit.
   * @default Map()
   * @example
   * {
   *   calories: '389 calories',
   *   fatContent: '19 grams fat',
   *   // ...
   * }
   */
  nutrients: Map<string, string>
  /**
   * The dietary restrictions specified by the recipe.
   * @default Set()
   * @example ['Vegan Diet', 'Vegetarian Diet']
   */
  dietaryRestrictions: List
  /**
   * A list of keywords associated with a recipe.
   * @example ['easy', 'quick', 'dinner']
   */
  keywords: List
}

/**
 * The fields of a recipe that can be extracted by scraping the HTML.
 * The 'host' field is omitted because it is a static field
 * that is not scraped.
 */
export type RecipeFields = Omit<RecipeData, 'host'>

/**
 * The fields that aren't required for a recipe to be valid.
 */
export type OptionalRecipeFields = Pick<
  RecipeFields,
  | 'siteName'
  | 'category'
  | 'cookTime'
  | 'prepTime'
  | 'totalTime'
  | 'cuisine'
  | 'cookingMethod'
  | 'ratings'
  | 'ratingsCount'
  | 'equipment'
  | 'reviews'
  | 'nutrients'
  | 'dietaryRestrictions'
  | 'keywords'
  | 'links'
  | 'notes'
>
