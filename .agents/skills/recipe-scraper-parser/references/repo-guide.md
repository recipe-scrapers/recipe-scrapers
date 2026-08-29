# Recipe Scrapers Repository Guide

Use this reference for host-support work after the skill has been selected.

## Inspect First

- `AGENTS.md`
- `src/abstract-scraper.ts`
- `src/types/recipe.interface.ts`
- `src/types/scraper.interface.ts`
- `src/scrapers/_index.ts`
- `src/scrapers/__tests__/scrapers.test.ts`
- The nearest existing scraper and fixture with a similar extraction shape

## Choose the Integration Point

| Evidence | Change |
| --- | --- |
| Generic schema.org extraction matches the expected recipe | Add the canonical host to `SCHEMA_ORG_ONLY_HOSTS` |
| One or more fields require site-specific extraction | Add or update a normalized scraper class and register it in `customScraperClasses` |
| Another hostname should use the same custom scraper | Add it to `scraperAliases` |
| Multiple unrelated hosts need the same extraction behavior | Consider a shared plugin or utility, with regression coverage for affected hosts |

Custom scrapers extend `AbstractScraper` and normally override fields through `protected override readonly extractors`. Prefer the repository's established normalized filename and class naming over the literal hostname.

## Fixture Intake

Raw upstream fixtures live under `.temp/<host>/`. Convert one host with:

```sh
bun scripts/process-test-data.ts <host>
```

The processor mirrors files into `test-data/<host>/`, copies non-JSON files unchanged, and normalizes JSON into the current fixture shape. It skips destinations that already exist; inspect existing output before intentionally replacing or editing it.

Every `test-data/**/*.testhtml` fixture needs a sibling `.json` file. The expected JSON matches `Omit<RecipeObject, 'schemaVersion'>` and should contain only fields the scraper emits.

The shared harness infers optional parsing modes from expected output:

- Parsed ingredient entries enable `parseIngredients`.
- A `notes` field enables `parseNotes`.

If upstream fixture data is needed and is not already in `.temp`, `bun run fetch-test-data` downloads the Python project's fixture corpus. This is a networked, broad download, so use it only when it is relevant to the requested host.

## Resolve Ambiguous Expectations

Inspect the local HTML and generic extraction result first. Useful structured sources include JSON-LD, `__NEXT_DATA__`, and other embedded application state.

If the normalized expected JSON still conflicts with observed TypeScript behavior, compare the matching upstream scraper at:

```text
https://github.com/hhursev/recipe-scrapers/tree/main/recipe_scrapers
```

Use the upstream implementation to understand intent, not as a reason to copy unrelated behavior or weaken shared extraction.

## Validate

Run the focused host suite first, escaping regex punctuation in the hostname when necessary:

```sh
bun test src/scrapers/__tests__/scrapers.test.ts --test-name-pattern "Scraper: example\.com"
```

Then run the full scraper harness and repository checks:

```sh
bun test src/scrapers/__tests__/scrapers.test.ts
bun run lint
```

`bun run lint` runs Biome and `bun run ts:check`, so a separate typecheck command is unnecessary unless diagnosing a failure.
