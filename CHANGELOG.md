<!-- markdownlint-disable MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0](https://github.com/recipe-scrapers/recipe-scrapers/compare/1.0.2...1.1.0) (2026-02-27)


### Features

* add food.com scraper ([ec73413](https://github.com/recipe-scrapers/recipe-scrapers/commit/ec73413f2d2e16d48a66491eb18fd736b06538ad))


### Bug Fixes

* string author extraction ([c35a10e](https://github.com/recipe-scrapers/recipe-scrapers/commit/c35a10e1dad772c84b5ce6e7100341cae505bee2))

## [1.0.2] - 2026-02-26

### Changed

- Update dependencies
- Use Cheerio to decode HTML entities instead of custom implementation
- Enable sourcemaps in build output

## [1.0.1] - 2026-02-23

### Changed

- Rename package from `recipe-scrapers-js` to `recipe-scrapers`
- Update repository metadata to `recipe-scrapers/recipe-scrapers`
- Clarify canonical package and installation instructions in README

## [1.0.0] - 2026-01-17

### Changed

- Promote `1.0.0-rc.*` to stable `1.0.0`
- Update dependencies: `parse-ingredient@^1.3.3`, `zod@^4.3.5`, `tsdown@^0.19.0`, `@biomejs/biome@2.3.11`

### Fixed

- Allow ingredient items to have `parsed: null` when ingredient parsing fails

## [1.0.0-rc.4] - 2025-12-21

### Fixed

- Fix `zNonEmptyArray` typing

## [1.0.0-rc.3] - 2025-12-21

### Changed

- Enforce positive integer values for recipe time fields (`totalTime`, `cookTime`, `prepTime`)
- Rename schema helper `zPositiveNumber` to `zPositiveInteger`
- Stop defaulting nullable schema fields to `null`

## [1.0.0-rc.2] - 2025-12-20

### Added

- Add `schemaVersion` to recipe schema

### Changed

- Make `links` optional; it stays `undefined` unless link parsing is enabled
- Extract schema transform/refinement validations into `applyRecipeValidations`

## [1.0.0-rc.1] - 2025-12-20

### Added

- Add `tsdown` configuration file

### Fixed

- Fix `main`/`module`/`types` entries in `package.json`; add `exports`

## [1.0.0-rc.0] - 2025-12-20

### Added

- Optional ingredient parsing via [parse-ingredient](https://github.com/jakeboone02/parse-ingredient)
- `parse()` and `safeParse()` methods for Zod-validated recipe extraction

### Changed

- **BREAKING**: Rename `toObject()` method to `toRecipeObject()` for clarity
- **BREAKING**: Ingredients and instructions now require grouped structures (each group has `name` and `items`) instead of flat arrays

---

## Pre-Release History

Prior to version 1.0.0-rc.0, this project was in alpha development. No formal changelog was maintained during the alpha phase.

[1.0.1]: https://github.com/recipe-scrapers/recipe-scrapers/releases/tag/v1.0.1
[1.0.0]: https://github.com/recipe-scrapers/recipe-scrapers/releases/tag/v1.0.0
[1.0.0-rc.0]: https://github.com/recipe-scrapers/recipe-scrapers/releases/tag/v1.0.0-rc.0
