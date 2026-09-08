/**
 * Why recipe evidence could not be classified conclusively.
 *
 * - `partial-evidence`: Some recognized recipe signals were found, but usable
 *   ingredients and instructions were not both available.
 * - `malformed-structured-data`: Structured data was present but could not be
 *   parsed reliably.
 * - `extractor-runtime-failure`: An extractor crashed while inspecting an
 *   evidence field.
 */
export type RecipeEvidenceReason =
  | 'partial-evidence'
  | 'malformed-structured-data'
  | 'extractor-runtime-failure'

interface RecipeEvidenceSignals {
  /** Whether recognized JSON-LD or microdata contained a Recipe entity. */
  readonly structuredRecipeFound: boolean

  /** Whether the effective extraction pipeline found a non-empty ingredient. */
  readonly ingredientsFound: boolean

  /** Whether the effective extraction pipeline found a non-empty instruction. */
  readonly instructionsFound: boolean
}

/**
 * Evidence of recipe content found in the supplied HTML.
 *
 * Evidence follows the scraper's effective merged Recipe representation and
 * is independent of full Recipe Object extraction and validation. A detected
 * result does not guarantee that every required recipe field is available.
 * Likewise, not-detected means only that the supplied HTML contained no
 * evidence recognized by the library.
 */
export type RecipeEvidence =
  | (RecipeEvidenceSignals & {
      /** Non-empty ingredients and instructions were both found. */
      readonly status: 'detected'
    })
  | (RecipeEvidenceSignals & {
      /** No recognized recipe signals were found in the supplied HTML. */
      readonly status: 'not-detected'
    })
  | (RecipeEvidenceSignals & {
      /** Evidence was partial or could not be inspected reliably. */
      readonly status: 'uncertain'

      /** One or more structured explanations for the uncertain result. */
      readonly reasons: ReadonlyArray<RecipeEvidenceReason>
    })
