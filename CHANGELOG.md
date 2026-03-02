<!-- markdownlint-disable MD024 MD004 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.1](https://github.com/recipe-scrapers/recipe-scrapers/compare/1.5.0...1.5.1) (2026-03-02)


### Bug Fixes

* **schema-org:** recover malformed JSON-LD and surface unrecoverable parse failures ([08e7ff5](https://github.com/recipe-scrapers/recipe-scrapers/commit/08e7ff528252a087c1b3b3d81c8b786d46fb6c42))

## [1.5.0](https://github.com/recipe-scrapers/recipe-scrapers/compare/1.4.0...1.5.0) (2026-03-01)


### Features

* add inspiredtaste.net scraper ([d5ed8c3](https://github.com/recipe-scrapers/recipe-scrapers/commit/d5ed8c3ae4e84e7fe420141bd86f83263e8fa878))
* Add structured safeParse extraction errors for UI-level branching ([51f775c](https://github.com/recipe-scrapers/recipe-scrapers/commit/51f775c41e7f9001ae3b44b3070ba4c898a1164c))
* **scrapers:** add bonappetit.com ([52facef](https://github.com/recipe-scrapers/recipe-scrapers/commit/52facefc100f98ccd705b92150e37d30ed5b19a0))


### Code Refactoring

* Improve extraction error handling and make safeParse resilient ([e824d39](https://github.com/recipe-scrapers/recipe-scrapers/commit/e824d3946b5832a5cf665fdc5bfcd386de87c521))

## [1.4.0](https://github.com/recipe-scrapers/recipe-scrapers/compare/1.3.1...1.4.0) (2026-03-01)


### Features

* add scrapers ([#16](https://github.com/recipe-scrapers/recipe-scrapers/issues/16)) ([d7fd157](https://github.com/recipe-scrapers/recipe-scrapers/commit/d7fd157f29c7a8044c378152effdc5e5e663ef78))

## [1.3.1](https://github.com/recipe-scrapers/recipe-scrapers/compare/1.3.0...1.3.1) (2026-02-28)


### Bug Fixes

* **extractor:** avoid shared mutable defaults for optional recipe fields ([53239e0](https://github.com/recipe-scrapers/recipe-scrapers/commit/53239e08771f10b991bdc6aea26d0ddc7f6eb7b5))
* **ingredients:** avoid false fallback when grouped ingredients contain duplicates ([46695cb](https://github.com/recipe-scrapers/recipe-scrapers/commit/46695cb675d564bd6f37ca4bd1931a8c4b574de5))
* **schema:** use effective max length in zString error messages ([c782cfe](https://github.com/recipe-scrapers/recipe-scrapers/commit/c782cfe727caff69bba3044b17202882744f401f))
* **url:** parse hostname safely and only strip leading www ([cfe4185](https://github.com/recipe-scrapers/recipe-scrapers/commit/cfe4185de611e5a2f01cb426fc53da029f4657d9))
* **yields:** make parseYields deterministic across repeated calls ([63c19d2](https://github.com/recipe-scrapers/recipe-scrapers/commit/63c19d23b631da43d3d3590570afe0f381b74271))

## [1.3.0](https://github.com/recipe-scrapers/recipe-scrapers/compare/1.2.0...1.3.0) (2026-02-27)


### Features

* **validation:** standardize schema validation on Standard Schema v1 ([12c836c](https://github.com/recipe-scrapers/recipe-scrapers/commit/12c836c6567916775ea7b6a9bbd39513c3823d1f))

## [1.2.0](https://github.com/recipe-scrapers/recipe-scrapers/compare/1.1.0...1.2.0) (2026-02-27)


### Features

* wild mode ([344663c](https://github.com/recipe-scrapers/recipe-scrapers/commit/344663cf294dd65bb08f2dc5afa403a386fe29c3))

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
