# Copilot Instructions for Recipe Scrapers

You are helping with a TypeScript project that scrapes recipe data from various cooking websites. The project extracts structured recipe information from HTML pages using multiple extraction methods.

## Project Structure

```txt
recipe-scrapers/
├── src/
│   ├── __tests__/       # Core test files
│   ├── exceptions/      # Custom exceptions
│   ├── plugins/         # Generic extraction plugins (JSON-LD, microdata, etc.)
│   ├── schemas/         # Zod schemas
│   ├── scrapers/        # Site-specific scrapers + scraper registry
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── index.ts         # Public entry point
├── test-data/           # HTML fixtures and expected JSON outputs
└── scripts/             # Test-data fetch/process scripts
```

## Key Technologies

- **Bun** for development and testing
- **Cheerio** for HTML parsing and DOM manipulation

## Runtime Boundaries (Important)

- **`src/**` (library/runtime code): Keep code runtime-agnostic and portable.
- In `src/**`, do **not** introduce Bun-only globals/APIs (for example `Bun.file`, `Bun.Glob`, `Bun.serve`).
- In `src/**`, prefer platform-neutral JavaScript/TypeScript and existing project abstractions.
- **`src/**/__tests__/**`, `scripts/**`, and test tooling**: Bun-specific APIs are acceptable.
- If a change touches both `src/**` and tests, keep Bun usage confined to tests/scripts only.

## TypeScript Rules

### Strict Type Safety

- **Never use non-null assertions (!)**
- **Never use `any`** - Use proper types, unions, or `unknown` instead
- **Avoid type casting** unless absolutely necessary and safe
- Use **type guards** for runtime type checking instead of casting
- Prefer **union types** over loose typing: `string | number` not `any`

## Code Patterns

### Extraction Methods

1. **JSON-LD**: Extract from `<script type="application/ld+json">` tags
2. **Microdata**: Parse HTML microdata attributes (`itemprop`)
3. **OpenGraph**: Parse OpenGraph meta tags (`og:site_name`)
4. **Site-specific**: Custom extractors for each cooking website

### Expected Output Format

Reference `RecipeObject` from `src/types/recipe.interface.ts`

## Testing Guidelines

- Use Bun for unit tests
- Prefer `it` style test syntax
- Place test files in `__tests__/` directory with `.test.ts` suffix
- Test data goes in `test-data/[sitename]/` with `.testhtml` and `.json` files
- Mock external dependencies when needed
- Bun globals/APIs are allowed in tests and scripts, but should not leak into `src/**`

## Common Tasks

### Adding New Site Scraper

1. Create `src/scrapers/[sitename].ts`
2. Export class extending `AbstractScraper`
3. Register the scraper in `src/scrapers/_index.ts`
4. Add test data in `test-data/[sitename]/`

## Code Style

- Keep `src/**` runtime-portable; avoid Bun-specific APIs there
- Use the latest ECMAScript (ESM) features
- Use `import`/`export` instead of `require`
- Use `const`/`let` instead of `var`
- Prefer template literals for string interpolation
- Use destructuring for object/array assignments
- Add JSDoc comments for public functions
- Handle errors gracefully with try/catch

When suggesting code changes:

- Prioritize maintainability and readability
- Include error handling
- Add tests for new functionality
- Follow existing project patterns
- Use meaningful variable names
