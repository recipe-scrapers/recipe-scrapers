# Ingredients Architecture

This document focuses on ingredient extraction. For full system architecture, see
[Architecture](./architecture.md).

## Overview

Ingredient extraction combines:

1. generic structured-data extraction (Schema.org JSON-LD and microdata),
2. optional site-specific regrouping in scrapers, and
3. optional parsing into structured quantities/units via `parse-ingredient`.

## Data Model

Core ingredient types live in `src/types/recipe.interface.ts` and are validated
by schemas in `src/schemas/recipe.schema.ts`.

```typescript
type ParsedIngredient = {
  quantity: number | null
  quantity2: number | null
  unitOfMeasureID: string | null
  unitOfMeasure: string | null
  description: string
  isGroupHeader: boolean
}

type IngredientItem = {
  value: string
  parsed?: ParsedIngredient | null
}

type IngredientGroup = {
  name: string | null
  items: IngredientItem[]
}

type Ingredients = IngredientGroup[]
```

## Extraction Flow

### 1) Structured Data Extraction

`SchemaOrgPlugin` extracts ingredients from schema.org content and converts them
with `stringsToIngredients(...)`, which creates a single default group (`name: null`).

This gives clean, normalized ingredient text, but not section grouping.

### 2) Optional Site-Specific Regrouping

A site scraper can override `ingredients(prevValue)` and use `prevValue` as the
input from plugins.

Common pattern:

1. flatten plugin ingredients with `flattenIngredients(prevValue)`
2. parse page structure with selectors
3. rebuild grouped ingredients with `groupIngredients(...)`

### 3) Optional Ingredient Parsing

If scraper option `parseIngredients` is enabled, `IngredientParserPlugin`
post-processes ingredient items and adds `item.parsed`.

Post-processor order:

1. `HtmlStripperPlugin` (priority 100)
2. `IngredientParserPlugin` (priority 50)

## Flatten -> Regroup Pattern

This pattern is useful when:

- Schema.org text quality is high
- HTML carries useful section structure (headings + list layout)

Example skeleton:

```typescript
import { flattenIngredients, groupIngredients } from '@/utils/ingredients'
import type { RecipeFields } from '@/types/recipe.interface'

protected ingredients(
  prevValue: RecipeFields['ingredients'] | undefined,
): RecipeFields['ingredients'] {
  if (!prevValue || prevValue.length === 0) {
    throw new Error('No ingredients found')
  }

  const values = flattenIngredients(prevValue)

  return groupIngredients(
    this.$,
    values,
    'h3.some-group-heading',
    'li.some-ingredient',
  )
}
```

## `groupIngredients(...)` Behavior

`groupIngredients($, ingredientValues, headingSelector?, itemSelector?)`:

1. resolves selectors:
   - if custom selectors are provided and both match DOM elements, they are used
   - if custom selectors are provided but missing in the DOM, returns ungrouped fallback
   - if no custom selectors are provided, tries built-in selector sets (WPRM/Tasty)
   - if none match, returns ungrouped fallback
2. checks ingredient count:
   - compares unique, non-empty found HTML ingredient text count to `ingredientValues.length`
   - on mismatch, returns ungrouped fallback
3. walks headings and items in document order
4. normalizes heading/item text with `normalizeString(...)`
5. matches each HTML item to best candidate from `ingredientValues` using
   fuzzy bigram similarity (`bestMatch`)
6. returns grouped `Ingredients`

Notes:

- matching is fuzzy, not exact
- normalization trims and collapses whitespace (it does not lowercase)
- fallback to ungrouped output is intentional for resilience

## Current Utility Functions

Defined in `src/utils/ingredients.ts`:

- `flattenIngredients(ingredients): string[]`
- `stringsToIngredients(values, groupName?): Ingredients`
- `groupIngredients($, values, headingSelector?, itemSelector?): Ingredients`
- `bestMatch(testString, targetStrings): string`
- `scoreSentenceSimilarity(first, second): number`

## Site-Specific Example

Current scraper implementations like NYTimes and BBC Good Food use:

- `flattenIngredients(prevValue)` for clean text input
- `groupIngredients(...)` with site selectors for grouping restoration

Simply Recipes additionally removes group-header-like values from structured
data before regrouping.

## When to Override Ingredients

Override `ingredients(prevValue)` when:

- grouping in final output matters for the site
- HTML structure has reliable ingredient sections
- plugin output is clean but not grouped as desired

Skip override when plugin output is already sufficient.

## Common Pitfalls

- parsing raw HTML ingredient text directly when `prevValue` already has cleaner text
- forgetting fallback behavior for selector/count mismatches
- changing normalized source text unnecessarily before matching
- using Bun-only APIs in `src/**` runtime code

## Ingredient Parsing Details

Enable parsed ingredient objects with:

```typescript
const recipe = await scrapeRecipe(html, url, {
  parseIngredients: true,
})
```

Or pass parser options:

```typescript
const recipe = await scrapeRecipe(html, url, {
  parseIngredients: {
    normalizeUOM: true,
    ignoreUOMs: ['small'],
  },
})
```

Each `IngredientItem` may then include:

- `quantity` / `quantity2`
- `unitOfMeasure` / `unitOfMeasureID`
- `description`
- `isGroupHeader`

## Summary

Ingredients are extracted in layers:

1. structured-data extraction for reliable text,
2. optional scraper regrouping for site-aware structure,
3. optional parser enrichment for machine-friendly ingredient fields.

This keeps default behavior robust while allowing targeted scraper overrides.
