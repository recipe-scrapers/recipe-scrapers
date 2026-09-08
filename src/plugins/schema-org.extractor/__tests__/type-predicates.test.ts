import { describe, expect, it } from 'bun:test'

import {
  hasId,
  isAggregateRating,
  isBaseType,
  isGraphType,
  isHowToSection,
  isHowToStep,
  isOrganization,
  isPerson,
  isRecipe,
  isRestrictedDiet,
  isSchemaOrgData,
  isThingType,
  isWebPage,
  isWebSite,
} from '../type-predicates'

describe('type-predicates', () => {
  describe('hasId', () => {
    it('returns true when @id is present and a string', () => {
      const obj = { '@id': 'http://example.com' }
      // @ts-expect-error
      expect(hasId(obj)).toBe(true)
    })
    it('returns false when @id is missing or not a string', () => {
      // @ts-expect-error
      expect(hasId({})).toBe(false)
      // @ts-expect-error
      expect(hasId({ '@id': 123 })).toBe(false)
    })
  })

  describe('isGraphType', () => {
    it('returns true for object with @graph array', () => {
      const graph = { '@graph': [{ '@type': 'Thing' }] }
      expect(isGraphType(graph)).toBe(true)
    })
    it('returns false for invalid graph shapes', () => {
      expect(isGraphType(null)).toBe(false)
      expect(isGraphType({ '@graph': 'not-array' })).toBe(false)
      expect(isGraphType([])).toBe(false)
    })
  })

  describe('isBaseType', () => {
    it('returns true for object with @type string', () => {
      expect(isBaseType({ '@type': 'TestType' })).toBe(true)
    })
    it('returns true for object with @type array', () => {
      expect(isBaseType({ '@type': ['TestType'] })).toBe(true)
    })
    it('returns false for missing or non-string @type', () => {
      expect(isBaseType({})).toBe(false)
      expect(isBaseType({ '@type': 5 })).toBe(false)
    })
  })

  describe('isSchemaOrgData', () => {
    it('is true for graph or base types', () => {
      const graph = { '@graph': [] }
      const base = { '@type': 'Thing' }
      expect(isSchemaOrgData(graph)).toBe(true)
      expect(isSchemaOrgData(base)).toBe(true)
    })
    it('is false otherwise', () => {
      expect(isSchemaOrgData({})).toBe(false)
      expect(isSchemaOrgData('string')).toBe(false)
    })
  })

  describe('isThingType and specific type guards', () => {
    const make = (type: string) => ({ '@type': type })
    it('isThingType matches given type', () => {
      expect(isThingType(make('Custom'), 'Custom')).toBe(true)
      expect(isThingType(make('Other'), 'Custom')).toBe(false)
    })

    it('isAggregateRating recognizes type', () => {
      expect(isAggregateRating(make('AggregateRating'))).toBe(true)
      expect(isAggregateRating(make('Recipe'))).toBe(false)
    })
    it('isHowToSection recognizes type', () => {
      expect(isHowToSection(make('HowToSection'))).toBe(true)
      expect(isHowToSection(make('HowToStep'))).toBe(false)
    })
    it('isHowToStep recognizes type', () => {
      expect(isHowToStep(make('HowToStep'))).toBe(true)
      expect(isHowToStep(make('HowToSection'))).toBe(false)
    })
    it('isOrganization recognizes type', () => {
      expect(isOrganization(make('Organization'))).toBe(true)
      expect(isOrganization(make('Person'))).toBe(false)
    })
    it('isPerson recognizes type', () => {
      expect(isPerson(make('Person'))).toBe(true)
      expect(isPerson(make('Recipe'))).toBe(false)
    })
    it('isRecipe recognizes type', () => {
      expect(isRecipe(make('Recipe'))).toBe(true)
      expect(isRecipe(make('AggregateRating'))).toBe(false)
    })
    it('isRestrictedDiet recognizes type', () => {
      expect(isRestrictedDiet(make('RestrictedDiet'))).toBe(true)
      expect(isRestrictedDiet(make('WebPage'))).toBe(false)
    })
    it('isWebPage recognizes type', () => {
      expect(isWebPage(make('WebPage'))).toBe(true)
      expect(isWebPage(make('WebSite'))).toBe(false)
    })
    it('isWebSite recognizes type', () => {
      expect(isWebSite(make('WebSite'))).toBe(true)
      expect(isWebSite(make('WebPage'))).toBe(false)
    })
  })
})
