# Recipe Scrapers

[![npm version](https://img.shields.io/npm/v/recipe-scrapers.svg?style=flat-square)](https://www.npmjs.com/package/recipe-scrapers)
[![build](https://img.shields.io/github/actions/workflow/status/recipe-scrapers/recipe-scrapers/ci.yml?branch=main&style=flat-square)](https://github.com/recipe-scrapers/recipe-scrapers/actions)
[![license](https://img.shields.io/npm/l/recipe-scrapers.svg?style=flat-square)](LICENSE)
[![All Contributors](https://img.shields.io/github/all-contributors/recipe-scrapers/recipe-scrapers?color=ee8449&style=flat-square)](#contributors)

A TypeScript library for scraping recipe data from various cooking websites. This is a JavaScript port inspired by the Python [recipe-scrapers](https://github.com/hhursev/recipe-scrapers) library.

## Features

- Extract structured recipe data from cooking websites
- Support for multiple popular recipe sites
- Built with TypeScript for better developer experience
- Fast and lightweight using the Bun runtime for development and testing
- Comprehensive test coverage

## Installation

Add the `recipe-scrapers` package and its peer dependencies.

```bash
npm install recipe-scrapers cheerio zod
# or
yarn add recipe-scrapers cheerio zod
# or
pnpm add recipe-scrapers cheerio zod
# or
bun add recipe-scrapers cheerio zod
```

## Usage

### Basic Usage

```typescript
import { getScraper, scrapeRecipe } from 'recipe-scrapers'

const html = `<html>The html to scrape...</html>`
const url = 'https://allrecipes.com/recipe/example'

// Get a scraper for a specific URL
// This function throws by default if a scraper does not exist.
const MyScraper = getScraper(url)
const scraper = new MyScraper(html, url, /* { ...options } */)

// Get the recipe data
const rawRecipe = await scraper.toRecipeObject()

// Get the schema validated recipe data
const validatedRecipe = await scraper.parse()

// Enable fallback mode for unsupported hosts
const FallbackScraper = getScraper(url, { wildMode: true })

// One-shot helper (wild mode is enabled by default)
const parsed = await scrapeRecipe(html, url)

// One-shot helper with a safe parse result
const safeResult = await scrapeRecipe(html, url, { safeParse: true })
```

### Validation Schema

By default, recipe data is validated with the built-in Zod schema.

You can also validate with any [Standard Schema](https://github.com/standard-schema/standard-schema) compatible schema (for example Valibot).

```typescript
import { scrapeRecipe } from 'recipe-scrapers'

// Example: a Standard Schema-compatible schema from another library
import { RecipeSchema as ValibotRecipeSchema } from './valibot-recipe-schema'

const result = await scrapeRecipe(html, url, {
  safeParse: true,
  schema: ValibotRecipeSchema,
})
```

### Options

```typescript
interface ScraperOptions {
  /**
   * Additional extractors to be used by the scraper.
   * These extractors will be added to the default set of extractors.
   * Extractors are applied according to their priority.
   * Higher priority extractors will run first.
   * @default []
   */
  extraExtractors?: ExtractorPlugin[]
  /**
   * Additional post-processors to be used by the scraper.
   * These post-processors will be added to the default set of post-processors.
   * Post-processors are applied after all extractors have run.
   * Post-processors are also applied according to their priority.
   * Higher priority post-processors will run first.
   * @default []
   */
  extraPostProcessors?: PostProcessorPlugin[]
  /**
   * Whether link scraping is enabled.
   * @default false
   */
  linksEnabled?: boolean
  /**
   * Logging level for the scraper.
   * This controls the verbosity of logs produced by the scraper.
   * @default LogLevel.WARN
   */
  logLevel?: LogLevel
  /**
   * Enable ingredient parsing using the parse-ingredient library.
   * When enabled, each ingredient item will include a `parsed` field
   * containing structured data (quantity, unit, description, etc.).
   * Can be `true` for defaults or an options object.
   * @see https://github.com/jakeboone02/parse-ingredient
   * @default false
   */
  parseIngredients?: boolean | ParseIngredientOptions
  /**
   * Standard Schema-compatible schema used for validation.
   * Useful when validating with libraries such as Valibot.
   */
  schema?: StandardSchemaV1<unknown, RecipeObject>
}
```

## Supported Sites

This library supports recipe extraction from various popular cooking websites. The scraper automatically detects the appropriate parser based on the URL.

## Copyright and Usage

_**This library is for educational and personal use. Please respect the robots.txt files and terms of service of the websites you scrape.**_

## Development

Project policy documents:

- [Contributing guide](./CONTRIBUTING.md)
- [Governance](./GOVERNANCE.md)

### Prerequisites

- [Bun](https://bun.sh/) (latest version)

### Setup

```bash
# Clone the repository
git clone https://github.com/recipe-scrapers/recipe-scrapers.git
cd recipe-scrapers

# Install dependencies
bun install

# Run tests
bun test

# Build the project
bun run build
```

### Scripts

- `bun run build` - Build the library for distribution
- `bun test` - Run the test suite
- `bun test:coverage` - Run tests with a coverage report
- `bun fetch-test-data` - Fetch test data from the original Python repository
- `bun lint` - Run linting and type checking
- `bun lint:fix` - Fix linting issues automatically

### Adding New Scrapers

1. Fetch test data from the original Python repository

    ```bash
    bun fetch-test-data
    ```

2. Convert the data into the expected JSON format (i.e. the `RecipeObject` interface)

    ```bash
    bun process-test-data <host>
    ```

3. Choose the scraper type:
   - **Schema.org-only host** (no site-specific extraction needed): add the hostname to `SCHEMA_ORG_ONLY_HOSTS` in [src/scrapers/_index.ts](./src/scrapers/_index.ts)
   - **Custom scraper** (site-specific extraction needed): create a new scraper class extending `AbstractScraper`
4. If using a custom scraper, add it to `customScraperClasses` in [src/scrapers/_index.ts](./src/scrapers/_index.ts)
5. Add optional host aliases to `scraperAliases` in [src/scrapers/_index.ts](./src/scrapers/_index.ts) when needed
6. Run tests to ensure the extraction works as expected
7. Update documentation as needed

```typescript
import { AbstractScraper } from './abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'

export class NewSiteScraper extends AbstractScraper {
  static host() {
    return 'www.newsite.com'
  }

  extractors = {
    ingredients: this.extractIngredients.bind(this),
  }

  protected extractIngredients(): RecipeFields['ingredients'] {
    const items = this.$('.ingredient')
      .map((_, el) => this.$(el).text().trim())
      .get()

    return [
      {
        name: null,
        items: items.map((value) => ({ value })),
      },
    ]
  }
  
  // ... implement other extraction methods
}
```

## Testing

The project uses test data from the original Python recipe-scrapers repository to ensure compatibility and accuracy. Tests are written using Bun's built-in test runner.

```bash
# Run all tests
bun test

# Run tests with coverage
bun test:coverage
```

## Acknowledgments

- Original [recipe-scrapers](https://github.com/hhursev/recipe-scrapers) Python library by [hhursev](https://github.com/hhursev)
- [Schema.org Recipe specification](https://schema.org/Recipe)
- [Cheerio](https://cheerio.js.org/) for HTML parsing
- [Zod](https://zod.dev/) for schema validation
- [Standard Schema](https://github.com/standard-schema/standard-schema) for schema interoperability
- [parse-ingredient](https://github.com/jakeboone02/parse-ingredient) for ingredient parsing

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

Project direction and maintainer decision rules are documented in [GOVERNANCE.md](./GOVERNANCE.md).

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
