import { expect, it } from 'bun:test'

import type { ParseIngredientOptions } from 'parse-ingredient'

import type { IngredientParserOptions } from '../ingredient-parser.interface'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
    ? (<Value>() => Value extends Right ? 1 : 2) extends <Value>() => Value extends Left ? 1 : 2
      ? true
      : false
    : false

type Assert<Condition extends true> = Condition

it('matches the upstream parse-ingredient options type', () => {
  const typesMatch: Assert<Equal<IngredientParserOptions, ParseIngredientOptions>> = true
  expect(typesMatch).toBe(true)
})
