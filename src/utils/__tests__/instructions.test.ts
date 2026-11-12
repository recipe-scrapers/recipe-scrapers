import { describe, expect, it } from 'bun:test'

import {
  createInstructionGroup,
  createInstructionItem,
  flattenInstructions,
  isInstructionGroup,
  isInstructionItem,
  isInstructions,
  isRedundantStepName,
  splitInstructions,
  splitNumberedInstructions,
  stringsToInstructions,
} from '../instructions'

describe('createInstructionItem', () => {
  it('creates an instruction item with value', () => {
    const item = createInstructionItem('Preheat oven to 350°F')
    expect(item).toEqual({ value: 'Preheat oven to 350°F' })
  })
})

describe('createInstructionGroup', () => {
  it('creates a group with name and items', () => {
    const items = [createInstructionItem('Step 1'), createInstructionItem('Step 2')]
    const group = createInstructionGroup('For the sauce', items)
    expect(group).toEqual({
      name: 'For the sauce',
      items: [{ value: 'Step 1' }, { value: 'Step 2' }],
    })
  })

  it('creates a group with null name', () => {
    const items = [createInstructionItem('Mix well')]
    const group = createInstructionGroup(null, items)
    expect(group).toEqual({
      name: null,
      items: [{ value: 'Mix well' }],
    })
  })
})

describe('isInstructionItem', () => {
  it('returns true for valid instruction item', () => {
    expect(isInstructionItem({ value: 'Cook pasta' })).toBe(true)
  })

  it('returns false for invalid values', () => {
    expect(isInstructionItem(null)).toBe(false)
    expect(isInstructionItem(undefined)).toBe(false)
    expect(isInstructionItem('string')).toBe(false)
    expect(isInstructionItem({ value: 123 })).toBe(false)
    expect(isInstructionItem({})).toBe(false)
  })
})

describe('isInstructionGroup', () => {
  it('returns true for valid instruction group', () => {
    expect(
      isInstructionGroup({
        name: 'For the cake',
        items: [{ value: 'Bake' }],
      }),
    ).toBe(true)
    expect(
      isInstructionGroup({
        name: null,
        items: [{ value: 'Mix' }],
      }),
    ).toBe(true)
  })

  it('returns false for invalid values', () => {
    expect(isInstructionGroup(null)).toBe(false)
    expect(isInstructionGroup({ name: 'test' })).toBe(false)
    expect(isInstructionGroup({ items: [] })).toBe(false)
  })
})

describe('isInstructions', () => {
  it('returns true for valid instructions array', () => {
    expect(isInstructions([{ name: null, items: [{ value: 'Step 1' }] }])).toBe(true)
    expect(isInstructions([])).toBe(true)
  })

  it('returns false for invalid values', () => {
    expect(isInstructions(null)).toBe(false)
    expect(isInstructions('string')).toBe(false)
    expect(isInstructions([{ invalid: true }])).toBe(false)
  })
})

describe('flattenInstructions', () => {
  it('flattens grouped instructions to array of strings', () => {
    const instructions = [
      { name: 'Sauce', items: [{ value: 'Simmer' }, { value: 'Stir' }] },
      { name: null, items: [{ value: 'Serve' }] },
    ]
    expect(flattenInstructions(instructions)).toEqual(['Simmer', 'Stir', 'Serve'])
  })

  it('returns empty array for empty input', () => {
    expect(flattenInstructions([])).toEqual([])
  })
})

describe('stringsToInstructions', () => {
  it('converts string array to instructions with null group name', () => {
    const result = stringsToInstructions(['Step 1', 'Step 2'])
    expect(result).toEqual([{ name: null, items: [{ value: 'Step 1' }, { value: 'Step 2' }] }])
  })

  it('returns single empty group for empty input', () => {
    expect(stringsToInstructions([])).toEqual([{ name: null, items: [] }])
  })
})

describe('splitInstructions', () => {
  it('removes heading "Preparation" with optional colon', () => {
    const input = 'Preparation: Step one.\n\nStep two.'
    const output = splitInstructions(input)
    expect(output).toEqual(['Step one.', 'Step two.'])
  })

  it('leaves string without known heading untouched', () => {
    const input = 'NoHeadingHere Step. Another step.'
    const output = splitInstructions(input)
    // single paragraph, should split on sentence boundary
    expect(output).toEqual(['NoHeadingHere Step.', 'Another step.'])
  })

  it('splits on double newlines into steps', () => {
    const input = 'First step.\n\nSecond step.\n\nThird step.'
    expect(splitInstructions(input)).toEqual(['First step.', 'Second step.', 'Third step.'])
  })

  it('splits single paragraph into sentences when only one block', () => {
    const input = 'Cook noodles. Add sauce. Serve immediately.'
    expect(splitInstructions(input)).toEqual(['Cook noodles.', 'Add sauce.', 'Serve immediately.'])
  })

  it('trims excess whitespace and collapses internal newlines', () => {
    const input = '   Preparation   \n   Mix  ingredients\nand stir.   '
    expect(splitInstructions(input)).toEqual(['Mix ingredients and stir.'])
  })

  it('returns empty array for empty input', () => {
    expect(splitInstructions('')).toEqual([])
  })
})

describe('splitNumberedInstructions', () => {
  it('splits inline numbered steps', () => {
    expect(splitNumberedInstructions('1. Heat oil. 2. Add onions. 3. Serve.')).toEqual([
      'Heat oil.',
      'Add onions.',
      'Serve.',
    ])
  })

  it('preserves text before the first numbered step', () => {
    expect(splitNumberedInstructions('Sauce: 1. Simmer. 2. Season.')).toEqual([
      'Sauce:',
      'Simmer.',
      'Season.',
    ])
  })

  it('returns normalized text when no numbered markers are present', () => {
    expect(splitNumberedInstructions('  Mix   well.  ')).toEqual(['Mix well.'])
  })

  it('returns an empty array for empty input', () => {
    expect(splitNumberedInstructions('')).toEqual([])
  })
})

describe('isRedundantStepName', () => {
  it('drops numbered step labels, including localized ones', () => {
    for (const name of [
      'Step 1',
      'step 12:',
      '1.',
      '2',
      '3)',
      'Schritt 1',
      'Passo 2',
      'Étape 3',
      'stap 4',
    ]) {
      expect(isRedundantStepName(name, 'Preheat the oven.')).toBe(true)
    }
  })

  it('drops a label followed by the start of the text', () => {
    expect(isRedundantStepName('Step 1: Preheat oven to 425…', 'Preheat oven to 425°F.')).toBe(true)
  })

  it('drops a truncated preview of the text', () => {
    expect(
      isRedundantStepName(
        'Butter one side of 6 slices of bread...',
        'Butter one side of 6 slices of bread and place each slice butter-side down.',
      ),
    ).toBe(true)
  })

  it('drops a name that repeats the start of the text in another case', () => {
    expect(isRedundantStepName('preheat oven', 'Preheat oven to 340°F.')).toBe(true)
    expect(isRedundantStepName('Whisk the eggs.', 'Whisk the eggs.')).toBe(true)
  })

  it('drops a name repeated in the text, both with a step number', () => {
    expect(
      isRedundantStepName(
        '1. Bring a large pot of salted water to a boil.',
        '1. Bring a large pot of salted water to a boil. Add the pasta.',
      ),
    ).toBe(true)
  })

  it('handles long names and text in linear time', () => {
    const long = `Step 1${' '.repeat(200_000)}x...`
    const started = performance.now()

    isRedundantStepName(long, long)
    expect(performance.now() - started).toBeLessThan(1000)
  })

  it('keeps real step titles', () => {
    expect(isRedundantStepName('Prepare the dough', 'Whisk the warm buttermilk and yeast.')).toBe(
      false,
    )
    expect(isRedundantStepName('Serve', 'Divide the rice among 4 bowls.')).toBe(false)
    expect(isRedundantStepName('350 degrees', 'Bake until golden.')).toBe(false)
  })
})
