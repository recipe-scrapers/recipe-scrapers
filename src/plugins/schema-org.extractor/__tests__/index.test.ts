import { describe, expect, it } from 'bun:test'
import { load } from 'cheerio'
import {
  ExtractionFailedException,
  UnsupportedFieldException,
} from '@/exceptions'
import type { RecipeFields } from '@/types/recipe.interface'
import { isIngredients } from '@/utils/ingredients'
import { isInstructions } from '@/utils/instructions'
import {
  SchemaOrgException,
  SchemaOrgJsonLdParseException,
  SchemaOrgPlugin,
} from '../index'

const minimalJsonLd = `
<script type="application/ld+json">
{
  "@graph": [
    { "@type": "WebSite", "name": "MySite" },
    {
      "@type": "Recipe",
      "name": "RecipeName",
      "author": "RecipeAuthor",
      "description": "Desc",
      "image": "https://img.jpg",
      "recipeIngredient": [" a ", "b"],
      "recipeInstructions": ["step1", "step2"],
      "recipeCategory": "Cat",
      "recipeYield": "4",
      "totalTime": "PT10M",
      "cookTime": "PT5M",
      "prepTime": "PT5M",
      "recipeCuisine": ["Cuisine"],
      "cookingMethod": "Bake",
      "aggregateRating": {
        "@type": "AggregateRating",
        "@id": "r1",
        "ratingValue": 4.5,
        "ratingCount": 10
      },
      "nutrition": { "calories": "100" },
      "keywords": ["kw1", " kw2 "],
      "suitableForDiet": "http://schema.org/Vegetarian"
    }
  ]
}
</script>`

describe('SchemaOrgException', () => {
  it('should throw an error with the correct message', () => {
    const error = new SchemaOrgException('title', null)
    expect(error).toBeInstanceOf(ExtractionFailedException)
    expect(error.name).toBe('SchemaOrgException')
    expect(error.message).toBe('Invalid value for "title": null')
  })
})

describe('SchemaOrgPlugin', () => {
  const $ = load(minimalJsonLd)
  const plugin = new SchemaOrgPlugin($)

  it('supports known recipe fields', () => {
    // biome-ignore lint/complexity/useLiteralKeys: private use only
    const keys = Object.keys(plugin['extractors'])
    expect(plugin.supports('title')).toBe(keys.includes('title'))
    expect(plugin.supports('ingredients')).toBe(true)
    expect(plugin.supports('dietaryRestrictions')).toBe(true)
    expect(plugin.supports('unknown' as keyof RecipeFields)).toBe(false)
  })

  it('extracts simple string fields', () => {
    expect(plugin.extract('siteName')).toBe('MySite')
    expect(plugin.extract('title')).toBe('RecipeName')
    expect(plugin.extract('author')).toBe('RecipeAuthor')
    expect(plugin.extract('description')).toBe('Desc')
    expect(plugin.extract('cookingMethod')).toBe('Bake')
  })

  it('resolves author references by @id', () => {
    const jsonWithAuthorReference = `
      <script type="application/ld+json">
      {
        "@graph": [
          {
            "@type": "Person",
            "@id": "https://example.com/#author",
            "name": "Reference Author"
          },
          {
            "@type": "Recipe",
            "name": "Recipe With Referenced Author",
            "author": { "@id": "https://example.com/#author" }
          }
        ]
      }
      </script>`

    const refPlugin = new SchemaOrgPlugin(load(jsonWithAuthorReference))

    expect(refPlugin.extract('author')).toBe('Reference Author')
  })

  it('extracts image and validates URL', () => {
    expect(plugin.extract('image')).toBe('https://img.jpg')
  })

  it('extracts numeric durations and times', () => {
    expect(plugin.extract('totalTime')).toBe(10)
    expect(plugin.extract('cookTime')).toBe(5)
    expect(plugin.extract('prepTime')).toBe(5)
    expect(plugin.extract('yields')).toBe('4 servings')
  })

  it('extracts ingredient and instruction lists', () => {
    const ingredients = plugin.extract('ingredients')

    expect(isIngredients(ingredients)).toBe(true)
    expect(ingredients).toEqual([
      { name: null, items: [{ value: 'a' }, { value: 'b' }] },
    ])

    const instructions = plugin.extract('instructions')
    expect(isInstructions(instructions)).toBe(true)
    expect(instructions).toEqual([
      { name: null, items: [{ value: 'step1' }, { value: 'step2' }] },
    ])
  })

  it('deduplicates ingredient values', () => {
    const jsonWithDupes = `
      <script type="application/ld+json">
      {
        "@type": "Recipe",
        "name": "Test",
        "recipeIngredient": ["salt", "pepper", "salt", "garlic", "pepper"]
      }
      </script>`
    const dupePlugin = new SchemaOrgPlugin(load(jsonWithDupes))
    const ingredients = dupePlugin.extract('ingredients')

    expect(ingredients).toEqual([
      {
        name: null,
        items: [{ value: 'salt' }, { value: 'pepper' }, { value: 'garlic' }],
      },
    ])
  })

  it('extracts categorical and list fields', () => {
    expect(Array.from(plugin.extract('category'))).toEqual(['Cat'])
    expect(Array.from(plugin.extract('cuisine'))).toEqual(['Cuisine'])
    expect(Array.from(plugin.extract('keywords'))).toEqual(['kw1', 'kw2'])
  })

  it('extracts ratings and counts correctly', () => {
    expect(plugin.extract('ratings')).toBe(4.5)
    expect(plugin.extract('ratingsCount')).toBe(10)
  })

  it('normalizes percentage-style ratings to a 5-point scale', () => {
    const percentageRatingJson = `
      <script type="application/ld+json">
      {
        "@type": "Recipe",
        "name": "Percentage Rated Recipe",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "97.9",
          "ratingCount": "2053",
          "bestRating": "100",
          "worstRating": "0"
        }
      }
      </script>`

    const percentageRatingPlugin = new SchemaOrgPlugin(
      load(percentageRatingJson),
    )

    expect(percentageRatingPlugin.extract('ratings')).toBe(4.9)
  })

  it('extracts nutrients and dietary restrictions', () => {
    const nutrients = plugin.extract('nutrients')
    expect(nutrients.get('calories')).toBe('100')
    const diets = Array.from(plugin.extract('dietaryRestrictions'))
    expect(diets).toEqual(['Vegetarian'])
  })

  it('groups WPRM ingredients', () => {
    const wprmHtml = `
      <script type="application/ld+json">
      {
        "@type": "Recipe",
        "name": "Grouped Recipe",
        "recipeIngredient": [
          "1 cup flour",
          "2 eggs",
          "1 cup milk"
        ]
      }
      </script>
      <div class="wprm-recipe-ingredients-container">
        <div class="wprm-recipe-ingredient-group">
          <h4 class="wprm-recipe-group-name">Batter</h4>
          <ul class="wprm-recipe-ingredients">
            <li class="wprm-recipe-ingredient">1 cup flour</li>
            <li class="wprm-recipe-ingredient">2 eggs</li>
          </ul>
        </div>
        <div class="wprm-recipe-ingredient-group">
          <h4 class="wprm-recipe-group-name">Sauce</h4>
          <ul class="wprm-recipe-ingredients">
            <li class="wprm-recipe-ingredient">1 cup milk</li>
          </ul>
        </div>
      </div>`

    const wprmPlugin = new SchemaOrgPlugin(load(wprmHtml))

    expect(wprmPlugin.extract('ingredients')).toEqual([
      {
        name: 'Batter',
        items: [{ value: '1 cup flour' }, { value: '2 eggs' }],
      },
      {
        name: 'Sauce',
        items: [{ value: '1 cup milk' }],
      },
    ])
  })

  it('throws UnsupportedFieldException for unsupported field', () => {
    expect(() => plugin.extract('foo' as keyof RecipeFields)).toThrow(
      UnsupportedFieldException,
    )
  })

  it('throws SchemaOrgException for missing required field', () => {
    // JSON-LD missing 'name' for Recipe
    const badJson = `<script type="application/ld+json">{"@type":"Recipe"}</script>`
    const badPlugin = new SchemaOrgPlugin(load(badJson))
    expect(() => badPlugin.extract('title')).toThrow(
      'No value found for "title"',
    )
  })

  it('throws SchemaOrgException for invalid image', () => {
    const badImgJson = `<script type="application/ld+json">{"@type":"Recipe","image":"nope"}</script>`
    const badPlugin = new SchemaOrgPlugin(load(badImgJson))
    expect(() => badPlugin.extract('image')).toThrow(
      'Invalid value for "image": nope',
    )
  })

  it('recovers malformed JSON-LD when control chars are inside string values', () => {
    const recoverableMalformedJsonLd = `
      <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Recipe","name":"Broken","author":{"@type":"Person","name":"A","description":"line1
line2"}}
      </script>
      <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Article","headline":"Fallback Article"}
      </script>
    `

    const plugin = new SchemaOrgPlugin(load(recoverableMalformedJsonLd))
    expect(plugin.extract('author')).toBe('A')
  })

  it('throws SchemaOrgJsonLdParseException when malformed JSON-LD is irreparable and blocks recipe extraction', () => {
    const irreparableMalformedJsonLd = `
      <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Recipe","name":"Broken"
      </script>
      <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Article","headline":"Fallback Article"}
      </script>
    `

    const plugin = new SchemaOrgPlugin(load(irreparableMalformedJsonLd))

    expect(() => plugin.extract('author')).toThrow(
      SchemaOrgJsonLdParseException,
    )
    expect(() => plugin.extract('author')).toThrow(
      'Failed to parse JSON-LD while extracting "author"',
    )
  })

  it('does not throw SchemaOrgJsonLdParseException if another valid Recipe exists', () => {
    const mixedJsonLd = `
      <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Recipe","name":"Broken","author":{"@type":"Person","name":"A","description":"line1
line2"}}
      </script>
      <script type="application/ld+json">
      {
        "@context":"https://schema.org",
        "@type":"Recipe",
        "name":"Working Recipe",
        "author":{"@type":"Person","name":"Good Author"}
      }
      </script>
    `

    const plugin = new SchemaOrgPlugin(load(mixedJsonLd))
    expect(plugin.extract('author')).toBe('Good Author')
  })
})
