---
name: recipe-scraper-parser
description: Implement or update recipe-site support in the `recipe-scrapers` TypeScript repository. Use for registering schema.org-only hosts, adding site-specific scraper classes, mapping hostname aliases, processing fixture captures, or verifying host extraction. Do not use for unrelated application features or generic parsing work without a host-specific requirement.
---

# Recipe Scraper Parser

Add host support at the narrowest layer justified by fixture evidence.

Before editing, read [references/repo-guide.md](references/repo-guide.md) for the registry layout, fixture pipeline, and validation commands.

## Workflow

1. Establish the canonical hostname, any aliases, the available HTML/JSON fixtures, and the fields that must be extracted.
2. When raw captures exist under `.temp/<host>/`, process them before implementation so decisions are based on the repository's normalized fixture shape.
3. Test the generic schema.org path first:
   - Register the hostname in `SCHEMA_ORG_ONLY_HOSTS` when generic extraction satisfies the fixture.
   - Create or update a site-specific `AbstractScraper` subclass only for fields the generic path cannot extract correctly.
   - Add `scraperAliases` entries only when alternate hostnames should resolve to the same custom scraper.
4. Keep host-specific behavior in its scraper. Change shared plugins or utilities only when the behavior is genuinely reusable and covered against affected hosts.
5. Add or update the smallest paired `.testhtml` and `.json` fixture that proves the behavior.
6. Run the host-focused scraper test, then the full scraper harness and repository lint when the focused result passes.

## Implementation Constraints

- Follow the repository's `AGENTS.md`, including its runtime-portability and strict TypeScript rules.
- Use the repository's normalized scraper filename rather than deriving a class or filename mechanically from the literal hostname.
- For custom field overrides, follow the existing `protected override readonly extractors` pattern.
- Prefer stable structured data such as JSON-LD or embedded application state over brittle presentation text or positional DOM selectors.
- Do not change shared extraction behavior merely to force one fixture to pass. Compare the upstream Python implementation when expectations remain unclear, then choose the smallest TypeScript change consistent with this repository.
- Preserve the user's scope: fixture processing or upstream comparison does not authorize unrelated scraper migrations or broad refactors.

## Completion

Finish only when registration and aliases are correct, fixture pairs match the emitted recipe object, and the relevant tests plus typecheck pass. Report any broader regressions separately instead of hiding them with host-specific exceptions.
