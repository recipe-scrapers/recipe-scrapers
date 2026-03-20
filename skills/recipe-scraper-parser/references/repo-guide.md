# Recipe Scrapers Repo Guide

## Files To Inspect First

- `AGENTS.md`
- `src/abstract-scraper.ts`
- `src/types/recipe.interface.ts`
- `src/types/scraper.interface.ts`
- `src/scrapers/_index.ts`
- `src/scrapers/__tests__/scrapers.test.ts`

## Common Edit Targets

- New custom scraper: `src/scrapers/<name>.ts`
- Schema.org-only host support: `src/scrapers/_index.ts`
- Existing host changes: the host scraper file plus any small shared utility it truly needs
- Raw fixture intake: `.temp/<host>/`
- Fixtures: `test-data/<host>/`

## Fixture Intake Entry Point

- Start fixture conversion with `scripts/process-test-data.ts`.
- Run:

```powershell
bun scripts/process-test-data.ts <host>
```

- Input: `.temp/<host>/`
- Output: `test-data/<host>/`
- Behavior:
  - Copies non-JSON files unchanged.
  - Normalizes JSON keys and list fields into the repo's expected fixture shape.
  - Converts ingredient and instruction groups into the current grouped schema.
  - Skips output files that already exist, so remove or rename stale outputs first if you need to regenerate them.

## Existing Test Harness Behavior

- `src/scrapers/__tests__/scrapers.test.ts` discovers `test-data/**/*.testhtml`.
- Each fixture must have a sibling `.json`.
- If a fixture JSON contains parsed ingredient data, the test harness enables `parseIngredients`.
- If a fixture JSON contains `notes`, the test harness enables `parseNotes`.

## Runtime Boundaries

- `src/**` must stay runtime-portable.
- Bun APIs are acceptable in tests and scripts, not in runtime library code.

## Typical Workflow For A New Parser

1. Convert raw fixture files from `.temp/<host>/` with `scripts/process-test-data.ts` when applicable.
2. Inspect the host HTML fixture for JSON-LD, `__NEXT_DATA__`, inline app state, and stable DOM hooks.
3. Decide whether the host can be supported by:
   - adding the hostname to `SCHEMA_ORG_ONLY_HOSTS`,
   - creating or updating a custom scraper in `src/scrapers/<name>.ts`,
   - and/or adding an alias in `scraperAliases`.
4. If a custom scraper is needed, use the repository's normalized scraper filename rather than the literal hostname.
5. Implement extraction with the smallest stable source first.
6. If fixture expectations are hard to reconcile, compare with the original Python scraper implementation before changing shared logic:

```text
https://github.com/hhursev/recipe-scrapers/tree/main/recipe_scrapers
```

7. Update the generated fixture JSON to match the new output.
8. Run typecheck and scraper tests.

## Notes On Optional Fields

- Omit optional fields when absent instead of emitting empty placeholder structures unless the repo already expects otherwise.
- For `notes`, prefer site-specific overrides when the data source does not fit the generic plugin path.
