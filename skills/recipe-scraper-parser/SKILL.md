---
name: recipe-scraper-parser
description: Add or update recipe host support in the `recipe-scrapers` TypeScript project, including schema.org-only host registration or site-specific scraper logic, aliases, fixture HTML/JSON setup, and Bun test verification. Use when Codex needs to implement a new supported host, extend an existing scraper with site-specific parsing, or wire new fixture data into the scraper test harness.
---

# Recipe Scraper Parser

Use this skill when working inside the `recipe-scrapers` repository on scraper-specific parsing changes.

## Workflow

1. Read [references/repo-guide.md](references/repo-guide.md) before editing.
2. If raw fixture files exist under `.temp/<host>/`, start by running `scripts/process-test-data.ts` to copy and normalize them into `test-data/<host>/`.
3. Inspect the target host, nearby utilities, and generated fixtures before deciding how much custom logic is actually needed.
4. Choose the narrowest host-support path first:
   - If the host works with the generic schema.org pipeline, add it to `SCHEMA_ORG_ONLY_HOSTS` in `src/scrapers/_index.ts` and do not create a custom scraper file.
   - If the host needs site-specific extraction, create or update a scraper class under `src/scrapers/<name>.ts` using the repository's normalized naming convention, then register it in `customScraperClasses`.
   - Add or update entries in `scraperAliases` when the same scraper must support alternate hostnames.
5. Prefer the narrowest implementation inside the chosen path:
   - Keep generic extraction in shared plugins/utilities only when the pattern is clearly reusable.
   - Keep host-specific parsing in the relevant normalized scraper file under `src/scrapers/`.
   - Keep runtime code in `src/**` portable; do not introduce Bun-only APIs there.
6. Update fixture coverage with the code change:
   - Prefer generated fixture files from `.temp` as the starting point.
   - Add or update `test-data/<host>/<name>.testhtml`.
   - Add or update the matching `.json` expected output after the normalization pass.
   - If the expected fixture includes parsed ingredients or notes, rely on the existing scraper test harness to enable `parseIngredients` or `parseNotes`.
   - If fixture output is hard to reconcile with the TypeScript scraper behavior, compare against the original Python scraper implementation at `https://github.com/hhursev/recipe-scrapers/tree/main/recipe_scrapers` to understand host-specific expectations before changing shared logic.
7. Verify the result with typecheck plus targeted scraper tests before finishing.

## Implementation Rules

- For schema.org-only hosts, prefer `SCHEMA_ORG_ONLY_HOSTS` over a custom scraper class.
- For custom scrapers, extend `AbstractScraper` and use `protected override readonly extractors` for field overrides.
- Reuse shared helpers when they fit existing patterns, especially in `src/utils/`.
- Parse structured payloads before brittle DOM text scraping when the site exposes reliable JSON.
- Normalize extracted strings and discard empty values.
- Do not use `any` or non-null assertions.
- Do not use Bun APIs in `src/**`.
- Register host support in `src/scrapers/_index.ts`, including `customScraperClasses`, `SCHEMA_ORG_ONLY_HOSTS`, and `scraperAliases` as appropriate.

## Fixture Workflow

- Treat `scripts/process-test-data.ts` as the default entry point when converting new fixture captures from `.temp/`.
- Run it with the host name:

```powershell
bun scripts/process-test-data.ts <host>
```

- The script copies non-JSON files unchanged, normalizes incoming JSON into the repo's expected fixture shape, and skips outputs that already exist.
- Keep fixture names aligned: each `.testhtml` must have a matching `.json`.
- Make fixture JSON match `Omit<RecipeObject, 'schemaVersion'>`.
- Include only fields the scraper should actually emit.
- When adding optional fields like `notes`, add them to the expected fixture so the shared scraper test enables the corresponding option automatically.
- After running the script, edit the generated JSON only where scraper-specific expectations differ from the raw normalized output.
- If the generated JSON and scraper output disagree in a way that is hard to explain, inspect the matching scraper in the original Python repository before changing shared extraction behavior:

```text
https://github.com/hhursev/recipe-scrapers/tree/main/recipe_scrapers
```

- Prefer updating or adding the smallest fixture needed to prove the parser behavior.

## Validation

Run these, adjusting scope when appropriate:

```powershell
bunx lint
bun test src\scrapers\__tests__\scrapers.test.ts
```

For focused iteration on one host, run the smallest test target that covers the change.

## Done Criteria

- Scraper logic is implemented in the right layer.
- Fixture HTML and expected JSON are in sync.
- Host registration is updated in the correct registry path, including aliases when needed.
- Typecheck passes.
- Relevant Bun tests pass.
