# Recipe Scrapers JS

[![npm version](https://img.shields.io/npm/v/recipe-scrapers-js.svg?style=flat-square)](https://www.npmjs.com/package/recipe-scrapers-js)
[![build](https://img.shields.io/github/actions/workflow/status/nerdstep/recipe-scrapers-js/ci.yml?branch=main&style=flat-square)](https://github.com/nerdstep/recipe-scrapers-js/actions)
[![license](https://img.shields.io/npm/l/recipe-scrapers-js.svg?style=flat-square)](LICENSE)

A TypeScript/JavaScript library for scraping recipe data from various cooking websites. This is a JavaScript port inspired by the Python [recipe-scrapers](https://github.com/hhursev/recipe-scrapers) library.

## Features

- Extract structured recipe data from cooking websites
- Support for multiple popular recipe sites
- Built with TypeScript for better developer experience
- Fast and lightweight using the Bun runtime for development and testing
- Comprehensive test coverage

## Installation

Add the `recipe-scrapers-js` package and its peer dependencies.

```bash
npm install recipe-scrapers-js cheerio zod
# or
yarn add recipe-scrapers-js cheerio zod
# or
pnpm add recipe-scrapers-js cheerio zod
# or
bun add recipe-scrapers-js cheerio zod
```

## Usage

### Basic Usage

```typescript
import { getScraper } from 'recipe-scrapers-js'

const html = `<html>The html to scrape...</html>`
const url = 'https://allrecipes.com/recipe/example'

// Get a scraper for a specific URL
// This function will throw if a scraper does not exist.
const MyScraper = getScraper(url)
const scraper = new MyScraper(html, url, /* { ...options } */)

// Get the recipe data
const rawRecipe = await scraper.toRecipeObject()

// Get the schema validated recipe data
const validatedRecipe = await scraper.parse()
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
}
```

## Supported Sites

This library supports recipe extraction from various popular cooking websites. The scraper automatically detects the appropriate parser based on the URL.

## Development

### Prerequisites

- [Bun](https://bun.sh/) (latest version)

### Setup

```bash
# Clone the repository
git clone https://github.com/nerdstep/recipe-scrapers-js.git
cd recipe-scrapers-js

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

3. Create a new scraper class extending `AbstractScraper`
4. Implement the required methods for data extraction
5. Add the scraper to the scrapers [registry](./src/scrapers/_index.ts)
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

The project uses test data from the original Python recipe-scrapers repository to ensure compatibility and accuracy. Tests are written using Bun's built-in test runner.

```bash
# Run all tests
bun test

# Run tests with coverage
bun test:coverage
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original [recipe-scrapers](https://github.com/hhursev/recipe-scrapers) Python library by [hhursev](https://github.com/hhursev)
- [Schema.org Recipe specification](https://schema.org/Recipe)
- [Cheerio](https://cheerio.js.org/) for HTML parsing
- [Zod](https://zod.dev/) for schema validation
- [parse-ingredient](https://github.com/jakeboone02/parse-ingredient) for ingredient parsing

## Copyright and Usage

_**This library is for educational and personal use. Please respect the robots.txt files and terms of service of the websites you scrape.**_
