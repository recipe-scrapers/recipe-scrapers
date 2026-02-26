<!-- markdownlint-disable MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0](https://github.com/recipe-scrapers/recipe-scrapers/compare/recipe-scrapers-1.0.2...recipe-scrapers-1.1.0) (2026-02-26)


### Features

* add allrecipes scraper ([43b480f](https://github.com/recipe-scrapers/recipe-scrapers/commit/43b480f4abf528bce9f4d26290a134f85cf490dc))
* add AmericasTestKitchen & EatingWell scrapers ([d4062ef](https://github.com/recipe-scrapers/recipe-scrapers/commit/d4062ef5c89f6b8614122c46f2c11375c02621ed))
* add BBCGoodFoods scraper ([35c7df3](https://github.com/recipe-scrapers/recipe-scrapers/commit/35c7df3ee6b6a560ae26fda24456a49cd23ef7dd))
* add description to html stripper ([cddcc85](https://github.com/recipe-scrapers/recipe-scrapers/commit/cddcc85b99c96177f176f901ae90ddbccb9f3aab))
* add seriouseats.com scraper ([395b852](https://github.com/recipe-scrapers/recipe-scrapers/commit/395b85265b205f53adae14fe5d1b2cdfbde27adc))
* Add SimplyRecipes scraper ([3ec78f0](https://github.com/recipe-scrapers/recipe-scrapers/commit/3ec78f0f7104f673da3ea99fe4d635af27fbade2))
* implement html stripper post processor ([a5b6690](https://github.com/recipe-scrapers/recipe-scrapers/commit/a5b6690c0ac5d735f2d6a2c829adf1b6a6fccb96))
* ingredient parsing ([6147a8e](https://github.com/recipe-scrapers/recipe-scrapers/commit/6147a8e1d2bc42220d17653f1e0986730fe3e055))
* recipe schema ([30dcf71](https://github.com/recipe-scrapers/recipe-scrapers/commit/30dcf717d60a4c54061fdf1ec4f7100064258d09))
* schemaVersion; refactor optional links ([fbfc6a2](https://github.com/recipe-scrapers/recipe-scrapers/commit/fbfc6a2ef6260e9ee18b3ce9638f45246ca93539))


### Bug Fixes

* **americastestkitchen:** image extraction ([c3e9751](https://github.com/recipe-scrapers/recipe-scrapers/commit/c3e975187a29ad2bd68fe9d9e363b12e1818b870))
* failed ingredient parse returns null ([0b19c65](https://github.com/recipe-scrapers/recipe-scrapers/commit/0b19c65946cd653132d10ae1d2dd671f4f8481fe))
* ingredient group; text normalization ([9334484](https://github.com/recipe-scrapers/recipe-scrapers/commit/9334484839f869bc97aa48f0cf9bc9d42c9bd903))
* instruction parsing ([afedfed](https://github.com/recipe-scrapers/recipe-scrapers/commit/afedfedd91763f78b3ea0385c61de85abfcd8c1d))
* parse-yields edge case ([c78860b](https://github.com/recipe-scrapers/recipe-scrapers/commit/c78860b71f8018631c660c00010cd89f2ce17c5b))
* remove www from hostname; strip &nbsp ([981cac1](https://github.com/recipe-scrapers/recipe-scrapers/commit/981cac1b99ee95ffb4a46cc4b70877f20494f0b4))
* **SchemaOrgPlugin:** isThingType array check; handle JSON-LD arrays ([77bd3f2](https://github.com/recipe-scrapers/recipe-scrapers/commit/77bd3f2d8617add2b79f1ef471543898d2280ac2))
* **SimplyRecipes:** instruction extraction ([4a17c2c](https://github.com/recipe-scrapers/recipe-scrapers/commit/4a17c2cfc17af6ae6d61b6b6bd2fc28ad88468f2))
* zNonEmptyArray typing ([66c09b5](https://github.com/recipe-scrapers/recipe-scrapers/commit/66c09b57dd353856931802c37a09b1b8deb69cc7))

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
