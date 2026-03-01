import { readdir } from 'node:fs/promises'
import path from 'node:path'
import type {
  IngredientGroup,
  InstructionGroup,
  RecipeFields,
} from '../src/types/recipe.interface'
import { isPlainObject, isString } from '../src/utils'
import {
  createIngredientGroup,
  createIngredientItem,
} from '../src/utils/ingredients'
import {
  createInstructionGroup,
  createInstructionItem,
  removeInstructionHeading,
} from '../src/utils/instructions'
import { normalizeString, splitToList } from '../src/utils/parsing'

const INPUT_DIR = path.resolve(import.meta.dir, '../.temp')
const OUTPUT_DIR = path.resolve(import.meta.dir, '../test-data')

const DEFAULT_VALUES = {
  siteName: null,
  category: [],
  cookTime: null,
  prepTime: null,
  totalTime: null,
  cuisine: [],
  cookingMethod: null,
  ratings: 0,
  ratingsCount: 0,
  equipment: [],
  reviews: {},
  nutrients: {},
  dietaryRestrictions: [],
  keywords: [],
} as const

const LIST_FIELDS = [
  'category',
  'cuisine',
  'dietaryRestrictions',
  'equipment',
  'ingredients',
  'instructions',
  'keywords',
] as const

// Per-site overrides for known bad data
// These are keyed by hostname, then by the JSON file name without extension
const OVERRIDE_VALUES: Record<
  string,
  Record<string, Partial<Record<keyof RecipeFields, unknown>>>
> = {
  'cooking.nytimes.com': {
    nytimes: {
      yields: '5 cups (about 120 to 160 crackers)',
    },
  },
  'epicurious.com': {
    epicurious: {
      canonicalUrl:
        'https://www.epicurious.com/recipes/food/views/ramen-noodle-bowl-with-escarole-and-spicy-tofu-crumbles',
    },
  },
}

/**
 * Returns true if the given path exists and is a directory
 */
async function isDirectory(path: string): Promise<boolean> {
  try {
    const stat = await Bun.file(path).stat()
    return stat.isDirectory()
  } catch {
    return false
  }
}

/** Convert snake_case or other keys to camelCase */
function toCamelCase(str: string) {
  return str.replace(/[_-](\w)/g, (_, v) => (v ? v.toUpperCase() : ''))
}

type RawIngredientGroup = { ingredients: string[]; purpose: string | null }

const isRawIngredientGroup = (v: unknown): v is RawIngredientGroup =>
  isPlainObject(v) && 'ingredients' in v && 'purpose' in v

type RawInstructionGroup = { instructions: string[]; purpose: string | null }

const isRawInstructionGroup = (v: unknown): v is RawInstructionGroup =>
  isPlainObject(v) && 'instructions' in v && 'purpose' in v

/**
 * Converts an array of raw ingredient-group objects into the new
 * IngredientGroup[] format. Groups without a defined or non-empty purpose
 * are given null as the name.
 *
 * @param input The raw ingredients value (expected shape:
 *   Array<{ ingredients: string[]; purpose: string | null }>)
 * @returns An array of IngredientGroup objects with the new format
 */
export function groupIngredientItems(
  input: RawIngredientGroup[],
): IngredientGroup[] {
  const result: IngredientGroup[] = []

  for (const { ingredients, purpose } of input) {
    const name = isString(purpose) && purpose.trim() ? purpose.trim() : null
    const items = Array.isArray(ingredients)
      ? ingredients
          .filter(isString)
          .map((value) => createIngredientItem(normalizeString(value)))
      : []

    result.push(createIngredientGroup(name, items))
  }

  return result
}

/**
 * Converts an array of raw instruction-group objects into the new
 * InstructionGroup[] format. Groups without a defined or non-empty purpose
 * are given null as the name.
 *
 * @param input The raw instructions value (expected shape:
 *   Array<{ instructions: string[]; purpose: string | null }>)
 * @returns An array of InstructionGroup objects with the new format
 */
export function groupInstructionItems(
  input: RawInstructionGroup[],
): InstructionGroup[] {
  const result: InstructionGroup[] = []

  for (const { instructions, purpose } of input) {
    const name = isString(purpose) && purpose.trim() ? purpose.trim() : null
    const items = Array.isArray(instructions)
      ? instructions
          .filter(isString)
          .map((value) =>
            createInstructionItem(
              removeInstructionHeading(normalizeString(value)),
            ),
          )
          .filter((item) => item.value !== '')
      : []

    result.push(createInstructionGroup(name, items))
  }

  return result
}

const HEADING_CONNECTOR_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'for',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
])

function isLikelyInstructionSectionHeading(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false

  // Recipe step text usually ends with punctuation or includes commas.
  // Section headings tend to be short title-style phrases.
  if (/[.:!?]$/.test(trimmed) || trimmed.includes(',')) return false
  if (trimmed.length > 80 || /\d/.test(trimmed)) return false

  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 8) return false

  return words.every((word, index) => {
    const cleaned = word.replace(/^[("'`]+|[)"'`]+$/g, '')
    if (!cleaned) return false

    const lower = cleaned.toLowerCase()
    if (index > 0 && HEADING_CONNECTOR_WORDS.has(lower)) return true

    return /^[A-Z][A-Za-z'-]*$/.test(cleaned)
  })
}

function groupFlatInstructionList(values: string[]): InstructionGroup[] {
  const cleanedValues = values
    .map((value) => removeInstructionHeading(normalizeString(value)))
    .filter((value) => value !== '')

  const headingIndexes = cleanedValues
    .map((value, index) =>
      isLikelyInstructionSectionHeading(value) ? index : null,
    )
    .filter((index): index is number => index !== null)

  // Require at least two heading markers to avoid over-grouping normal steps.
  if (headingIndexes.length < 2) {
    return [
      createInstructionGroup(
        null,
        cleanedValues.map((value) => createInstructionItem(value)),
      ),
    ]
  }

  const groups: InstructionGroup[] = []
  let currentName: string | null = null
  let currentItems: ReturnType<typeof createInstructionItem>[] = []

  for (const value of cleanedValues) {
    if (isLikelyInstructionSectionHeading(value)) {
      if (currentItems.length > 0 || currentName !== null) {
        groups.push(createInstructionGroup(currentName, currentItems))
      }
      currentName = value
      currentItems = []
      continue
    }

    currentItems.push(createInstructionItem(value))
  }

  if (currentItems.length > 0 || currentName !== null) {
    groups.push(createInstructionGroup(currentName, currentItems))
  }

  // If any parsed group has no steps, fall back to a single group.
  if (groups.some((group) => group.items.length === 0)) {
    return [
      createInstructionGroup(
        null,
        cleanedValues.map((value) => createInstructionItem(value)),
      ),
    ]
  }

  return groups
}

function normalizeData(
  host: string,
  filename: string,
  data: Record<string, unknown>,
) {
  // start with default values
  let result: Record<string, unknown> = {
    ...DEFAULT_VALUES,
  }

  // merge & camelCase incoming keys
  for (const [key, value] of Object.entries(data)) {
    let prop = toCamelCase(key)

    // remap instructionsList → instructions
    if (prop === 'instructionsList') {
      prop = 'instructions'
    }

    if (prop === 'ingredientGroups') {
      prop = 'ingredients'
    }

    result[prop] = value
  }

  // Clean & group instructions
  if (Array.isArray(result.instructions)) {
    if (result.instructions.every(isRawInstructionGroup)) {
      result.instructions = groupInstructionItems(result.instructions)
    } else if (result.instructions.every(isString)) {
      result.instructions = groupFlatInstructionList(result.instructions)
    }
  }

  // Clean & group ingredients
  if (Array.isArray(result.ingredients)) {
    if (result.ingredients.every(isRawIngredientGroup)) {
      result.ingredients = groupIngredientItems(result.ingredients)
    } else if (result.ingredients.every(isString)) {
      // Convert flat string array to single group with null name
      const items = result.ingredients.map((value) =>
        createIngredientItem(normalizeString(value)),
      )
      result.ingredients = [createIngredientGroup(null, items)]
    }
  }

  // Ensure certain fields are always arrays
  for (const field of LIST_FIELDS) {
    const v = result[field]

    if (isString(v)) {
      result[field] = splitToList(v, ',')
    }
  }

  // Apply per-site overrides
  return applyOverrides(host, filename, result)
}

function applyOverrides(
  host: string,
  filename: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const overrides = OVERRIDE_VALUES[host]?.[filename]
  if (!overrides) return data
  return { ...data, ...overrides }
}

/**
 * Read JSON, normalize data, write to outPath
 */
async function processJson(host: string, inPath: string, outPath: string) {
  let raw: string
  let data: Record<string, unknown>

  try {
    raw = await Bun.file(inPath).text()
    data = JSON.parse(raw)
  } catch {
    console.error(`Skipping invalid JSON: ${inPath}`)
    return
  }

  const filename = path.basename(inPath, '.json')
  const output = normalizeData(host, filename, data)
  const content = JSON.stringify(output, null, 2)

  await Bun.write(outPath, content)
}

/** Recursively traverse input directory, mirroring structure in output dir */
async function traverse(host: string, inDir: string, outDir: string) {
  for (const entry of await readdir(inDir, { withFileTypes: true })) {
    const inPath = path.join(inDir, entry.name)
    const outPath = path.join(outDir, entry.name)
    const relativePath = outPath.substring(OUTPUT_DIR.length + 1)

    if (entry.isDirectory()) {
      await traverse(host, inPath, outPath)
    } else if (entry.isFile()) {
      const exists = await Bun.file(outPath).exists()

      if (exists) {
        console.log(`Skipped:   ${relativePath} (already exists)`)
        continue
      }

      if (entry.name.endsWith('.json')) {
        await processJson(host, inPath, outPath)
        console.log(`Processed: ${relativePath}`)
      } else {
        // copy non-JSON files unchanged
        const data = await Bun.file(inPath).arrayBuffer()
        await Bun.write(outPath, data)
        console.log(`Copied:    ${relativePath}`)
      }
    }
  }
}

async function main(host: string | undefined) {
  if (host) {
    const inDir = path.resolve(INPUT_DIR, host)
    const outDir = path.resolve(OUTPUT_DIR, host)

    if (!(await isDirectory(inDir))) {
      console.error(`Input directory does not exist: ${inDir}`)
      return
    }

    await traverse(host, inDir, outDir)
  } else {
    console.error('Usage: bun process-test-data <host>')
  }
}

/**
 * Read first CLI arg as host
 * (e.g. `bun process-test-data allrecipes.com`)
 */
const [, , host] = process.argv

await main(host)
