# Instructions for Recipe Scrapers

A TypeScript library that turns a caller-supplied Recipe Page (HTML plus its URL) into a validated Recipe Object (`RecipeObject` in `src/types/recipe.interface.ts`). It never fetches pages; the URL's Host only selects the Scraper. Domain terms are defined in `CONTEXT.md`.

## Runtime Boundaries

`src/**` is the published library and must run unchanged in Node, Bun, and browsers, so oxlint rejects Bun APIs and `node:` imports there. Build on platform-neutral code and the helpers in `src/utils/`. Tests (`src/**/__tests__/**`) and `scripts/**` may use Bun and Node APIs freely.

## TypeScript

- Narrow `unknown` with type guards (`isString`, `isPlainObject`, etc. in `src/utils/index.ts`) or a schema parse. oxlint bans `as` casts outside tests; when a guard has already proven a type the compiler cannot follow, suppress that one line with the reason: `// oxlint-disable-next-line typescript/consistent-type-assertions -- <why it is safe>`.
- Add JSDoc to exported functions.
- Write look-alike characters such as the fraction slash (`\u2044`, not `/`) as `\u` escapes; oxlint already rejects literal invisible characters.

## Testing

- Put tests in a `__tests__/` directory beside the code, named `*.test.ts`, written with `it`. Add tests for new behaviour.
- A Test Fixture is `test-data/<host>/<name>.testhtml` plus `<name>.json`, the expected Recipe Object. The shared harness discovers every pair and infers `parseIngredients` and `parseNotes` from the JSON. An optional `<name>.options.json` supplies string caller fallbacks such as `fallbackDescription`.
- `bun run fetch-test-data` downloads the Python library's fixtures into `.temp/<host>/`, and `bun run process-test-data <host>` converts them into `test-data/<host>/`.

## Performance

- Parse-speed benchmarks in `bench/` run on CodSpeed in CI, one benchmark per extraction path. When a change adds an extraction path that no page in `PAGES` covers, add a fixture page for it.
- `bun run size` (after `bun run build`) fails when an entry outgrows its gzip budget in `bundle-size-budgets.json`. Raise a budget with `--update-budgets` only for intended growth, and say why in the commit.

## Adding a Supported Host

1. Decide whether the Host can be a Schema.org-only Host or needs a Scraper with Site-specific Extractors.
2. For a Schema.org-only Host, add the hostname to `SCHEMA_ORG_ONLY_HOSTS` in `src/scrapers/_index.ts`.
3. Otherwise create `src/scrapers/<name>.ts`, named by the repo's normalized convention rather than the literal hostname, export a class extending `AbstractScraper`, and register it in `customScraperClasses`. Alternate hostnames go in `scraperAliases`.
4. Add Test Fixtures in `test-data/<host>/`.
5. When fixture output is hard to reconcile, compare with the original Python scraper at `https://github.com/hhursev/recipe-scrapers/tree/main/recipe_scrapers` before changing shared extraction behaviour. Expected JSON converted from Python output is a reference: where our output is more accurate, update the JSON and say why in the commit.

## Pull Requests

PRs are squash-merged, and release-please writes the changelog from the squash commit alone. When a branch has more than one conventional commit, end the PR description with a commit override listing every commit subject, so each change gets its own changelog entry:

```text
BEGIN_COMMIT_OVERRIDE
fix(utils): first commit subject
feat(scrapers): second commit subject
END_COMMIT_OVERRIDE
```

- Build the list with `git log --reverse --format=%s origin/main..HEAD`, and rewrite it whenever commits are added, dropped, or reworded.
- Write the `BEGIN_COMMIT_OVERRIDE` marker only in the block itself. release-please reads from the first occurrence anywhere in the body, so a mention elsewhere breaks the override and drops the PR from the changelog.
- A merged PR's override can still be edited until its release is published; release-please picks up the change on its next run.
- Title the PR as a conventional commit; with a single commit, the title alone becomes the changelog entry.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for `recipe-scrapers/recipe-scrapers`. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain docs layout. See `docs/agents/domain.md`.
