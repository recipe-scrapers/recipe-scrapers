import { describe, expect, it } from 'bun:test'
import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import { inspectRecipeEvidence } from '@/index'
import { GenericScraper } from '@/scrapers/generic'
import { stringsToIngredients } from '@/utils/ingredients'
import { stringsToInstructions } from '@/utils/instructions'

const RECIPE_WITHOUT_AUTHOR = `
  <script type="application/ld+json">
    {
      "@type":"Recipe",
      "name":"Simple rice",
      "recipeIngredient":["1 cup rice","2 cups water"],
      "recipeInstructions":["Simmer the rice until tender."]
    }
  </script>
`

class CountingSiteScraper extends AbstractScraper {
  ingredientsCalls = 0
  instructionsCalls = 0

  static host() {
    return 'site.test'
  }

  protected override readonly extractors = {
    ingredients: () => {
      this.ingredientsCalls += 1
      return stringsToIngredients(['1 cup rice'])
    },
    instructions: () => {
      this.instructionsCalls += 1
      return stringsToInstructions(['Cook the rice.'])
    },
  } satisfies ScraperExtractors
}

class ThrowingSiteScraper extends AbstractScraper {
  static host() {
    return 'throwing.test'
  }

  protected override readonly extractors = {
    ingredients: () => stringsToIngredients(['1 cup rice']),
    instructions: () => {
      throw new Error('Instruction extractor crashed')
    },
  } satisfies ScraperExtractors
}

describe('recipe evidence', () => {
  it('detects a recipe independently when full parsing stops at author', async () => {
    const scraper = new GenericScraper(
      RECIPE_WITHOUT_AUTHOR,
      'https://example.com/rice',
    )

    expect(await scraper.inspectRecipeEvidence()).toEqual({
      status: 'detected',
      structuredRecipeFound: true,
      ingredientsFound: true,
      instructionsFound: true,
    })

    const parseResult = await scraper.safeParse()
    expect(parseResult.success).toBe(false)
    if (!parseResult.success) {
      expect(parseResult.error.code).toBe('extractor_not_found')
      expect(parseResult.error.context).toEqual({ field: 'author' })
    }
  })

  it('reports partial Recipe metadata as uncertain with a reason', async () => {
    const evidence = await inspectRecipeEvidence(
      '<script type="application/ld+json">{"@type":"Recipe","name":"Rice"}</script>',
      'https://example.com/rice',
    )

    expect(evidence).toEqual({
      status: 'uncertain',
      structuredRecipeFound: true,
      ingredientsFound: false,
      instructionsFound: false,
      reasons: ['partial-evidence'],
    })
  })

  it('reports irreparable structured data as uncertain', async () => {
    const evidence = await inspectRecipeEvidence(
      '<script type="application/ld+json">{"@type":"Recipe"</script>',
      'https://example.com/rice',
    )

    expect(evidence).toEqual({
      status: 'uncertain',
      structuredRecipeFound: false,
      ingredientsFound: false,
      instructionsFound: false,
      reasons: ['malformed-structured-data'],
    })
  })

  it.each([
    [
      'ordinary article',
      '<article><h1>News</h1><p>No recipe here.</p></article>',
    ],
    [
      'plain HTML recipe',
      '<h1>Rice</h1><h2>Ingredients</h2><p>Rice</p><h2>Method</h2><p>Cook it.</p>',
    ],
    [
      'access challenge',
      '<html><title>Checking your browser</title><p>Verify you are human</p></html>',
    ],
    [
      'an unsupported recipe index shape',
      `<script type="application/ld+json">
        {"@type":"ItemList","itemListElement":[{"@type":"ListItem","item":{"@type":"Recipe","name":"Rice"}}]}
      </script>`,
    ],
  ])('reports no recognized evidence for %s', async (_name, html) => {
    expect(
      await inspectRecipeEvidence(html, 'https://example.com/page'),
    ).toEqual({
      status: 'not-detected',
      structuredRecipeFound: false,
      ingredientsFound: false,
      instructionsFound: false,
    })
  })

  it.each([
    [
      'a JSON-LD array',
      `<script type="application/ld+json">[
        {"@type":"Article","headline":"Rice"},
        {"@type":"Recipe","recipeIngredient":["rice"],"recipeInstructions":["Cook it."]}
      ]</script>`,
    ],
    [
      'a nested WebPage mainEntity',
      `<script type="application/ld+json">
        {"@type":"WebPage","mainEntity":{"@type":"Recipe","recipeIngredient":["rice"],"recipeInstructions":["Cook it."]}}
      </script>`,
    ],
    [
      'a JSON-LD graph',
      `<script type="application/ld+json">
        {"@graph":[{"@type":"WebSite","name":"Recipes"},{"@type":"Recipe","recipeIngredient":["rice"],"recipeInstructions":["Cook it."]}]}
      </script>`,
    ],
    [
      'recipe microdata',
      `<div itemtype="https://schema.org/Recipe">
        <span itemprop="recipeIngredient">rice</span>
        <span itemprop="recipeIngredient">water</span>
        <span itemprop="recipeInstructions">Cook it.</span>
      </div>`,
    ],
  ])('supports %s through existing structured parsing', async (_name, html) => {
    expect(
      await inspectRecipeEvidence(html, 'https://example.com/rice'),
    ).toEqual({
      status: 'detected',
      structuredRecipeFound: true,
      ingredientsFound: true,
      instructionsFound: true,
    })
  })

  it('inspects the same merged recipe representation as extraction', async () => {
    const html = `
      <script type="application/ld+json">
        {"@type":"Recipe","recipeIngredient":["rice"]}
      </script>
      <script type="application/ld+json">
        {"@type":"Recipe","recipeInstructions":["Cook it."]}
      </script>
    `

    expect(
      await inspectRecipeEvidence(html, 'https://example.com/rice'),
    ).toEqual({
      status: 'detected',
      structuredRecipeFound: true,
      ingredientsFound: true,
      instructionsFound: true,
    })
  })

  it('uses the selected registered site extractor', async () => {
    const html = `
      <script type="application/ld+json">
        {"@type":"Recipe","recipeIngredient":["1 cup rice"]}
      </script>
      <div class="structured-project__steps"><ol><li>Cook the rice.</li></ol></div>
    `

    expect(
      await inspectRecipeEvidence(
        html,
        'https://simplyrecipes.com/recipes/rice',
      ),
    ).toEqual({
      status: 'detected',
      structuredRecipeFound: true,
      ingredientsFound: true,
      instructionsFound: true,
    })
  })

  it('reports a site extractor crash without throwing', async () => {
    const evidence = await new ThrowingSiteScraper(
      '',
      'https://throwing.test/rice',
    ).inspectRecipeEvidence()

    expect(evidence).toEqual({
      status: 'uncertain',
      structuredRecipeFound: false,
      ingredientsFound: true,
      instructionsFound: false,
      reasons: ['partial-evidence', 'extractor-runtime-failure'],
    })
  })

  it('caches evidence on a scraper instance', async () => {
    const scraper = new CountingSiteScraper('', 'https://site.test/rice')

    const first = await scraper.inspectRecipeEvidence()
    const second = await scraper.inspectRecipeEvidence()

    expect(second).toBe(first)
    expect(scraper.ingredientsCalls).toBe(1)
    expect(scraper.instructionsCalls).toBe(1)
  })
})
