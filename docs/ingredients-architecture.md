# Ingredients Architecture

This document focuses on ingredient extraction. For full system architecture, see
[Architecture](./architecture.md).

## Overview

Ingredient extraction combines:

1. generic structured-data extraction (Schema.org JSON-LD and microdata),
2. optional site-specific Ingredient Group recovery in scrapers, and
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

`SchemaOrgPlugin` extracts ingredient text from schema.org content, de-duplicates
it, and unwraps the extra parentheses WP Recipe Maker adds around ingredient
notes (`unwrapIngredientNotes`). It then calls `groupIngredients(...)` without
custom selectors, which restores groups from built-in WPRM/Tasty page structure
when present and otherwise returns a single default group (`name: null`).

This gives clean, normalized ingredient text, but only generic grouping.

### 2) Optional Site-Specific Ingredient Group Recovery

A scraper whose Recipe Page has reliable ingredient sections declares the page
structure it trusts, and `AbstractScraper` restores the Ingredient Groups from
the Structured Data ingredients:

```typescript
export class MySite extends AbstractScraper {
  static host() {
    return 'recipes.example'
  }

  protected override readonly ingredientGroupStructure = {
    heading: '.ingredients h3',
    item: '.ingredients li',
  }
}
```

`IngredientGroupStructure` fields:

- `heading`: selector for Ingredient Group headings
- `item`: selector for ingredient items
- `excludeSource` (optional): predicate for Structured Data values that are not
  ingredients, such as group headers some sites include in `recipeIngredient`

The declared structure is ignored when the scraper defines its own
`ingredients` extractor. A scraper that needs custom logic first (for example,
reading an embedded page payload) calls `recoverIngredientGroups(...)` from its
extractor instead.

### 3) Optional Ingredient Parsing

If scraper option `parseIngredients` is enabled, `IngredientParserPlugin`
loads the optional `parse-ingredient` peer dependency, post-processes ingredient
items, and adds `item.parsed`. The dependency is not loaded when ingredient
parsing is disabled.

Post-processor order:

1. `HtmlStripperPlugin` (priority 100)
2. `IngredientParserPlugin` (priority 50)

## Ingredient Group Recovery

Recovery is useful when:

- Schema.org text quality is high
- HTML carries useful section structure (headings + list layout)

`recoverIngredientGroups($, ingredients, structure)`:

1. flattens the previously extracted ingredients
2. drops values matched by `structure.excludeSource`
3. throws `NoIngredientsFoundException` when no source values remain, so the
   field reports `extractor_not_found` rather than a runtime failure
4. groups the values with `groupIngredients(...)` using the declared selectors

Example of calling it from a custom extractor:

```typescript
import { recoverIngredientGroups } from '@/utils/ingredients'

protected ingredients(
  prevValue: RecipeFields['ingredients'] | undefined,
): RecipeFields['ingredients'] {
  return (
    this.parsePayloadIngredients() ??
    recoverIngredientGroups(this.$, prevValue, {
      heading: 'h3.some-group-heading',
      item: 'li.some-ingredient',
    })
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
2. checks coverage:
   - returns ungrouped fallback when the HTML has fewer non-empty items, or fewer
     unique items, than `ingredientValues`
   - extra HTML items are allowed (some sites render the list more than once)
3. walks headings and items in document order
4. normalizes heading/item text with `normalizeString(...)` and strips a
   trailing `:` from headings
5. matches each HTML item to best candidate from `ingredientValues` using
   fuzzy bigram similarity (`bestMatch`)
6. skips a match already placed under the same heading, so a list rendered
   twice does not duplicate ingredients; the same value under different
   headings is kept, since schema.org extraction de-duplicates source values
7. returns grouped `Ingredients`, or ungrouped fallback when no group has items

Notes:

- matching is fuzzy, not exact
- the Structured Data text is kept; HTML only supplies group names and order
- normalization trims and collapses whitespace (it does not lowercase)
- fallback to ungrouped output is intentional for resilience

## Current Utility Functions

Defined in `src/utils/ingredients.ts`:

- `recoverIngredientGroups($, ingredients, structure): Ingredients`
- `groupIngredients($, values, headingSelector?, itemSelector?): Ingredients`
- `unwrapIngredientNotes(value): string`
- `flattenIngredients(ingredients): string[]`
- `stringsToIngredients(values, groupName?): Ingredients`
- `bestMatch(testString, targetStrings): string`
- `scoreSentenceSimilarity(first, second): number`

## Site-Specific Examples

- BBC Good Food, Inspired Taste, and NYTimes declare an `ingredientGroupStructure`
- Simply Recipes also declares `excludeSource` to drop group headers its JSON-LD
  lists as ingredients
- America's Test Kitchen reads its page payload first and calls
  `recoverIngredientGroups(...)` as a fallback

## When to Customize Ingredients

Declare an `ingredientGroupStructure` when:

- grouping in final output matters for the site
- HTML structure has reliable ingredient sections
- plugin output is clean but not grouped as desired

Override `ingredients(prevValue)` only when the site needs logic beyond
recovery, and skip both when plugin output is already sufficient.

## Common Pitfalls

- parsing raw HTML ingredient text directly when `prevValue` already has cleaner text
- flattening and regrouping by hand instead of using `recoverIngredientGroups(...)`
- changing normalized source text unnecessarily before matching
- using Bun-only APIs in `src/**` runtime code

## Ingredient Parsing Details

Install the optional parser before enabling ingredient parsing:

```bash
npm install parse-ingredient
```

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
2. optional Ingredient Group recovery for site-aware structure,
3. optional parser enrichment for machine-friendly ingredient fields.

This keeps default behavior robust while allowing targeted scraper overrides.
