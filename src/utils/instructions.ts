import type {
  InstructionGroup,
  InstructionItem,
  Instructions,
} from '@/types/recipe.interface'
import { isPlainObject, isString } from './index'
import { normalizeString, splitToList } from './parsing'

/**
 * List of possible headings to remove from instructions.
 */
const INSTRUCTION_HEADINGS = [
  'Preparation',
  'Directions',
  'Instructions',
  'Method',
  'Steps',
]

/**
 * Creates an InstructionItem.
 */
export function createInstructionItem(value: string): InstructionItem {
  return { value }
}

/**
 * Creates an InstructionGroup.
 */
export function createInstructionGroup(
  name: string | null,
  items: InstructionItem[] = [],
): InstructionGroup {
  return { name, items }
}

/**
 * Type guard to check if value is an InstructionItem.
 */
export function isInstructionItem(value: unknown): value is InstructionItem {
  return isPlainObject(value) && 'value' in value && isString(value.value)
}

/**
 * Type guard to check if value is an InstructionGroup.
 */
export function isInstructionGroup(value: unknown): value is InstructionGroup {
  return (
    isPlainObject(value) &&
    'name' in value &&
    'items' in value &&
    Array.isArray(value.items) &&
    value.items.every(isInstructionItem)
  )
}

/**
 * Type guard to check if value is an Instructions array.
 */
export function isInstructions(value: unknown): value is Instructions {
  return Array.isArray(value) && value.every(isInstructionGroup)
}

/**
 * Extracts the flat list of instruction values from an Instructions array.
 * Useful when scrapers need to re-group instructions.
 */
export function flattenInstructions(instructions: Instructions): string[] {
  return instructions.flatMap((group) => group.items.map((item) => item.value))
}

/**
 * Converts an array of strings to an Instructions array with a single
 * default group.
 */
export function stringsToInstructions(
  values: string[],
  groupName: string | null = null,
): Instructions {
  const items = values.map(createInstructionItem)
  return [createInstructionGroup(groupName, items)]
}

/**
 * Removes any heading from the start of the instructions string.
 */
export function removeInstructionHeading(value: string) {
  for (const heading of INSTRUCTION_HEADINGS) {
    const regex = new RegExp(`^\\s*${heading}\\s*:?\\s*`, 'i')
    if (regex.test(value)) {
      return value.replace(regex, '')
    }
  }
  return value
}

const NEW_LINE_REGEX = /\n\s*\n+/
const SENTENCE_BOUNDARY_REGEX = /(?<=\.)\s+(?=[A-Z])/

/**
 * Splits a recipe instructions string into an array of steps.
 * Removes known headings and trims whitespace.
 */
export function splitInstructions(value: string) {
  if (!value) return []

  const cleaned = removeInstructionHeading(value).trim()

  // Split on double newlines or paragraph breaks
  let steps = splitToList(cleaned, NEW_LINE_REGEX)

  // If only one step, try splitting on sentence boundaries as fallback
  if (steps.length === 1) {
    steps = splitToList(cleaned, SENTENCE_BOUNDARY_REGEX)
  }

  return steps
}

const NUMBERED_STEP_REGEX = /(?:^|\s)(\d+)\.\s+/g

/**
 * Splits text containing inline numbered steps such as
 * "1. Heat oil. 2. Add onions." into individual instruction strings.
 */
export function splitNumberedInstructions(value: string): string[] {
  const normalized = normalizeString(value)
  const matches = Array.from(normalized.matchAll(NUMBERED_STEP_REGEX))

  if (matches.length === 0) {
    return normalized ? [normalized] : []
  }

  const steps: string[] = []
  const firstMatch = matches[0]

  if (firstMatch && firstMatch.index > 0) {
    const prefix = normalizeString(normalized.slice(0, firstMatch.index))
    if (prefix) {
      steps.push(prefix)
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const nextMatch = matches[i + 1]

    if (!match) {
      continue
    }

    const start = match.index + match[0].length
    const end = nextMatch ? nextMatch.index : normalized.length
    const step = normalizeString(normalized.slice(start, end))

    if (step) {
      steps.push(step)
    }
  }

  return steps
}
