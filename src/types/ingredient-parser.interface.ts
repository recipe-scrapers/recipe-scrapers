/** Unit definition accepted by the optional ingredient parser. */
interface IngredientParserUnitOfMeasure {
  readonly short: string
  readonly plural: string
  readonly alternates?: readonly string[]
  readonly type?: 'volume' | 'mass' | 'length' | 'count' | 'other'
  readonly conversionFactor?:
    | number
    | {
        readonly us?: number
        readonly imperial?: number
        readonly metric?: number
      }
}

/** Options passed to the optional `parse-ingredient` integration. */
export interface IngredientParserOptions {
  normalizeUOM?: boolean
  additionalUOMs?: Record<string, IngredientParserUnitOfMeasure>
  ignoreUOMs?: readonly string[]
  allowLeadingOf?: boolean
  decimalSeparator?: '.' | ','
  round?: number | false
  groupHeaderPatterns?: readonly (string | RegExp)[]
  rangeSeparators?: readonly (string | RegExp)[]
  descriptionStripPrefixes?: readonly (string | RegExp)[]
  trailingQuantityContext?: readonly string[]
  leadingQuantityPrefixes?: readonly (string | RegExp)[]
  includeMeta?: boolean
  partialUnitMatching?: boolean
  descriptionMeasurements?: boolean
  measurementUnits?: 'all' | 'convertible'
}
