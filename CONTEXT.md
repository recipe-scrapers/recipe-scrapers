# Recipe Scrapers

Recipe Scrapers is a TypeScript library that turns recipe-page HTML from cooking websites into a normalized recipe object.

## Language

**Recipe Page**:
A cooking website page, represented by its HTML and URL, that may contain extractable recipe data.
_Avoid_: Document, source, HTML when referring to the page as a domain concept.

**Recipe Object**:
The validated, JSON-serializable representation of a recipe returned to library consumers.
_Avoid_: Recipe data when referring to the public output.

**Scraper**:
An extraction implementation selected for a host that turns a Recipe Page into a Recipe Object.
_Avoid_: Parser, crawler, spider.

**Host**:
The normalized hostname from a Recipe Page URL used to choose a Scraper.
_Avoid_: Site when referring to the scraper registry key, domain unless discussing URL structure.

**Schema.org-only Host**:
A supported Host whose Recipe Pages can be handled by generic Schema.org extraction without a dedicated Scraper class.
_Avoid_: Generic site, simple scraper.

**Generic Scraper**:
The fallback Scraper that attempts generic structured-data extraction for an unsupported Host.
_Avoid_: Supported scraper when the Host is not registered.

**Extractor**:
A field-level source of recipe values used by a Scraper.
_Avoid_: Scraper when referring to one field's extraction logic.

**Extractor Plugin**:
A reusable Extractor that reads common recipe metadata formats across hosts.
_Avoid_: Site-specific extractor when the logic is intended to work across many hosts.

**Site-specific Extractor**:
A Scraper-owned Extractor that corrects or fills a recipe field for one Host.
_Avoid_: Extractor plugin when the logic depends on one site's page structure.

**Structured Data**:
Machine-readable recipe metadata embedded in a Recipe Page, primarily Schema.org JSON-LD or microdata.
_Avoid_: OpenGraph when referring specifically to Schema.org-style recipe metadata.

**Recipe Field**:
One named piece of recipe information that can be extracted and validated as part of a Recipe Object.
_Avoid_: Property when discussing extraction behavior.

**Ingredient Group**:
A named or unnamed section of ingredient items in a Recipe Object.
_Avoid_: Section when the group specifically contains ingredients.

**Instruction Group**:
A named or unnamed section of preparation steps in a Recipe Object.
_Avoid_: Section when the group specifically contains instructions.

**Note Group**:
A named or unnamed section of author-supplied recipe notes in a Recipe Object.
_Avoid_: Section when the group specifically contains notes.

**Parsed Ingredient**:
Optional structured quantity, unit, and description data attached to an ingredient item.
_Avoid_: Normalized ingredient when referring to parser-enriched ingredient data.

**Validation**:
Checking an extracted Recipe Object against the configured recipe schema before returning it from public parse APIs.
_Avoid_: Scraping when referring specifically to schema checks after extraction.

**Safe Parse Result**:
A success-or-failure result returned instead of throwing when safe parsing is enabled.
_Avoid_: Error object when referring to the whole result.

**Test Fixture**:
A saved Recipe Page sample and expected Recipe Object used to verify scraper behavior.
_Avoid_: Snapshot unless referring to a snapshot testing mechanism.

## Relationships

- A **Recipe Page** belongs to one **Host**.
- A **Host** selects one **Scraper** when it is registered or aliased.
- A **Schema.org-only Host** is registered support without a dedicated site-specific Scraper class.
- The **Generic Scraper** may attempt extraction for an unsupported **Host** when fallback behavior is enabled.
- A **Scraper** uses **Extractor Plugins** and optional **Site-specific Extractors** to produce **Recipe Fields**.
- **Structured Data** is the preferred generic source for many **Recipe Fields**.
- **Ingredient Groups**, **Instruction Groups**, and **Note Groups** are grouped list fields within a **Recipe Object**.
- A **Parsed Ingredient** may be attached to an ingredient item without replacing the original ingredient text.
- **Validation** turns extracted field output into a schema-checked **Recipe Object** or a failure.
- A **Safe Parse Result** wraps either a valid **Recipe Object** or a structured failure.
- A **Test Fixture** pairs a saved **Recipe Page** with its expected **Recipe Object**.

## Example dialogue

> **Dev:** "This Host has good Schema.org data, but the ingredients lose their sauce and dough headings. Should we add a new Scraper?"
> **Domain expert:** "Register it as a custom Scraper only if a Site-specific Extractor can restore the Ingredient Groups from reliable page structure. Keep the Structured Data ingredient text as the source when possible."
>
> **Dev:** "If an unsupported Host works through the Generic Scraper, do we call it supported?"
> **Domain expert:** "No. It is only supported once the Host is registered, either as a Schema.org-only Host or with a dedicated Scraper and Test Fixtures."

## Flagged ambiguities

- "HTML" can mean the raw markup string or the broader **Recipe Page**; use **Recipe Page** when the URL and host-selection behavior matter.
- "Parser" can mean ingredient parsing, schema validation, or scraping; use **Scraper**, **Extractor**, **Parsed Ingredient**, or **Validation** instead.
- "Recipe data" can mean internal extraction state or public output; use **Recipe Object** for the validated consumer-facing result.
