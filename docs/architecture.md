# Recipe Scrapers Architecture

## Overview

Recipe Scrapers is a TypeScript library that extracts structured recipe data
from HTML. It combines:

- generic extractor plugins (Schema.org and OpenGraph),
- optional site-specific scraper overrides, and
- post-processors for cleanup and enrichment.

The final output is validated and returned as a `RecipeObject`.
By default this uses Zod, but any Standard Schema-compatible schema can be used.

## Public API

The public entry point is `src/index.ts`.

### Exports

- `scrapeRecipe(html, url, options?)`
- `getScraper(url, options?)`
- `GenericScraper`
- `scrapers` (host -> scraper class registry)
- schemas and types from `src/schemas/*` and `src/types/*`
- plugin base classes and logger

### Typical Usage

```typescript
import { scrapeRecipe } from 'recipe-scrapers'

const html = await fetch('https://cooking.nytimes.com/recipes/...').then((r) =>
  r.text(),
)

const recipe = await scrapeRecipe(html, 'https://cooking.nytimes.com/recipes/...')
console.log(recipe.title)
console.log(recipe.ingredients)
```

### Supported and Unsupported Hosts

- `getScraper(url)` defaults to `wildMode: false`
- `scrapeRecipe(...)` defaults to `wildMode: true`
- with `wildMode: true`, unsupported hosts use `GenericScraper`

## Extraction Pipeline

Extraction is field-based and runs inside `AbstractScraper`.

```txt
HTML + URL
  ->
Scraper class (host-matched, or GenericScraper)
  ->
For each RecipeFields key:
  1) Extractor plugins in priority order
  2) Site-specific extractor override (optional)
  3) Post-processors in priority order
  4) Field default value fallback (optional fields only)
  ->
RecipeData (internal)
  ->
toRecipeObject() converts Set/Map internals to arrays/objects
  ->
parse() or safeParse() via validation schema
```

Important ordering behavior:

- extractor plugins are sorted by `priority` descending
- the first plugin that returns a defined value "wins"
- site-specific extractor receives that value as `prevValue`

## Plugin System

## Extractor Plugins

Extractor plugins extend `ExtractorPlugin` and must implement:

- `supports(field)`
- `extract(field)`
- `name`
- `priority`

Built-in extractors:

- `SchemaOrgPlugin` (priority `90`)
- `OpenGraphPlugin` (priority `60`)

`SchemaOrgPlugin` handles both:

- JSON-LD (`<script type="application/ld+json">`)
- microdata extraction (via `extractRecipeMicrodata(...)`)

## Post-Processor Plugins

Post-processors extend `PostProcessorPlugin` and run per-field:

- `shouldProcess(field)`
- `process(field, value)`
- `name`
- `priority`

Built-in post-processors:

- `HtmlStripperPlugin` (priority `100`)
- `IngredientParserPlugin` (priority `50`, enabled when `parseIngredients` is set)

## Registration Model

Plugins are assembled by `AbstractScraper` through `PluginManager` constructor
arguments:

- base extractors + `extraExtractors`
- base post-processors + `extraPostProcessors`

`PluginManager` sorts both lists by priority descending.

## Scraper Model

Site scrapers extend `AbstractScraper` and implement:

- `static host(): string`
- `extractors` map for field overrides

Example pattern:

```typescript
import { AbstractScraper } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'

export class MySite extends AbstractScraper {
  static host() {
    return 'example.com'
  }

  extractors = {
    ingredients: this.ingredients.bind(this),
  }

  protected ingredients(
    prevValue: RecipeFields['ingredients'] | undefined,
  ): RecipeFields['ingredients'] {
    if (prevValue && prevValue.length > 0) {
      return prevValue
    }
    throw new Error('No ingredients found')
  }
}
```

All site scrapers must be registered in `src/scrapers/_index.ts`.

## Validation Model

Validation is built around:

- `RecipeObjectBaseSchema`
- `applyRecipeValidations(schema)`
- `RecipeObjectSchema` (base schema + recipe-level refinements/transforms)
- Standard Schema-compatible schemas (`schema` option)

Current validation includes:

- required/optional field checks
- URL and hostname checks
- non-empty ingredient/instruction group arrays
- ratings range and ratings count consistency
- `totalTime >= cookTime + prepTime` refinement
- transform to fill `totalTime` when missing and both `cookTime` + `prepTime` exist

`AbstractScraper` exposes:

- `toRecipeObject()` (no schema validation)
- `parse()` (throws on extraction or validation failure)
- `safeParse()` (returns a normalized success/error result)

`safeParse()` failure payloads include structured metadata:

- `error.type`: `'validation' | 'extraction'`
- `error.code`: one of
  - `'validation_failed'`
  - `'extractor_not_found'`
  - `'extraction_runtime_error'`
  - `'extraction_failed'`
- `error.context` (optional): `{ field?: string; source?: string }`

Code mapping:

- `extractor_not_found`: a required field had no successful extractor
- `extraction_runtime_error`: unexpected runtime error in plugin/site extractor
- `extraction_failed`: non-runtime extraction failure
- `validation_failed`: schema validation rejected extracted data

## Internal Data Shape Conversion

Inside `RecipeData`, some fields use `Set`/`Map` for extraction ergonomics.
`toRecipeObject()` converts them to JSON-serializable values:

- `Set<string>` -> `string[]`
- `Map<string, string>` -> `Record<string, string>`

## Project Structure

```txt
recipe-scrapers/
|- src/
|  |- index.ts
|  |- abstract-scraper.ts
|  |- recipe-extractor.ts
|  |- plugin-manager.ts
|  |- plugins/
|  |- scrapers/
|  |- schemas/
|  |- types/
|  |- utils/
|  |- exceptions/
|  `- __tests__/
|- test-data/
|- scripts/
`- docs/
```

## Testing Strategy

Tests run with Bun (`bun test`).

Main test types:

- unit tests for plugins, utils, schemas, and core classes
- integration-style scraper tests over real HTML fixtures in `test-data/<host>/`

Fixture format:

- `*.testhtml`: source HTML
- `*.json`: expected recipe output

## Runtime Boundaries

- `src/**` should remain runtime-portable (avoid Bun-only APIs)
- Bun-specific APIs are acceptable in tests and scripts

## Extending the System

### Add a New Scraper

1. Create `src/scrapers/<site>.ts`
2. Extend `AbstractScraper`
3. Add extractor overrides only where needed
4. Register in `src/scrapers/_index.ts`
5. Add fixtures under `test-data/<host>/`
6. Run tests

### Add a New Plugin

1. Implement `ExtractorPlugin` or `PostProcessorPlugin`
2. Add unit tests
3. Inject via scraper options (`extraExtractors` / `extraPostProcessors`) or
   update base plugin wiring in `AbstractScraper` if it should be globally enabled
