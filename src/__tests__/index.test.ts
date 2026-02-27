import { describe, expect, it } from 'bun:test'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import { getScraper, scrapeRecipe, scrapers } from '@/index'
import { RecipeObjectSchema } from '@/schemas/recipe.schema'
import { GenericScraper } from '@/scrapers/generic'
import type { RecipeObject } from '@/types/recipe.interface'

const UNSUPPORTED_URL = 'https://unsupported.example/recipes/wild-mode-soup'

const html = `
  <html lang="en">
    <head>
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Recipe",
          "name": "Wild Mode Soup",
          "author": { "@type": "Person", "name": "Test Cook" },
          "description": "Simple soup recipe",
          "image": "https://unsupported.example/images/soup.jpg",
          "recipeIngredient": ["1 cup water", "1 tsp salt"],
          "recipeInstructions": ["Boil water", "Add salt"],
          "recipeYield": "2 servings",
          "prepTime": "PT5M",
          "cookTime": "PT10M"
        }
      </script>
    </head>
    <body></body>
  </html>
`

const INVALID_SCHEMA_HTML = `
  <html lang="en">
    <head>
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Recipe",
          "name": "${'x'.repeat(501)}",
          "author": { "@type": "Person", "name": "Test Cook" },
          "description": "Simple soup recipe",
          "image": "https://unsupported.example/images/soup.jpg",
          "recipeIngredient": ["1 cup water", "1 tsp salt"],
          "recipeInstructions": ["Boil water", "Add salt"],
          "recipeYield": "2 servings",
          "prepTime": "PT5M",
          "cookTime": "PT10M"
        }
      </script>
    </head>
    <body></body>
  </html>
`

describe('getScraper', () => {
  it('returns the site scraper for supported hosts', () => {
    const scraper = getScraper('https://food.com/recipe/1')
    expect(scraper).toBe(scrapers['food.com'])
  })

  it('throws for unsupported hosts by default', () => {
    expect(() => getScraper(UNSUPPORTED_URL)).toThrow(
      "The website 'unsupported.example' is not currently supported.",
    )
  })

  it('returns GenericScraper for unsupported hosts in wild mode', () => {
    const scraper = getScraper(UNSUPPORTED_URL, { wildMode: true })
    expect(scraper).toBe(GenericScraper)
  })
})

describe('scrapeRecipe', () => {
  it('parses unsupported hosts in wild mode by default', async () => {
    const recipe = await scrapeRecipe(html, UNSUPPORTED_URL)

    expect(recipe.host).toBe('unsupported.example')
    expect(recipe.title).toBe('Wild Mode Soup')
    expect(recipe.author).toBe('Test Cook')
    expect(recipe.canonicalUrl).toBe(UNSUPPORTED_URL)
    expect(recipe.totalTime).toBe(15)
    expect(recipe.ingredients[0]?.items.length).toBe(2)
  })

  it('throws for unsupported hosts when wild mode is disabled', async () => {
    await expect(
      scrapeRecipe(html, UNSUPPORTED_URL, { wildMode: false }),
    ).rejects.toThrow(
      "The website 'unsupported.example' is not currently supported.",
    )
  })

  it('returns a safeParse success result when enabled', async () => {
    const result = await scrapeRecipe(html, UNSUPPORTED_URL, {
      safeParse: true,
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.title).toBe('Wild Mode Soup')
    }
  })

  it('returns a safeParse failure result on validation errors', async () => {
    const result = await scrapeRecipe(INVALID_SCHEMA_HTML, UNSUPPORTED_URL, {
      safeParse: true,
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path?.[0] === 'title'),
      ).toBe(true)
    }
  })

  it('uses a custom Standard Schema when provided', async () => {
    const strictTitleSchema: StandardSchemaV1<unknown, RecipeObject> = {
      '~standard': {
        version: 1,
        vendor: 'test-standard-schema',
        validate(value) {
          if (
            typeof value === 'object' &&
            value !== null &&
            'title' in value &&
            value.title === 'Wild Mode Soup'
          ) {
            return { value: RecipeObjectSchema.parse(value) }
          }

          return {
            issues: [
              { message: 'Title must match expected value', path: ['title'] },
            ],
          }
        },
      },
    }

    const result = await scrapeRecipe(html, UNSUPPORTED_URL, {
      safeParse: true,
      schema: strictTitleSchema,
    })

    expect(result.success).toBe(true)
  })
})
