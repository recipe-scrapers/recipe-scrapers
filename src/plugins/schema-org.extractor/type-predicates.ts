import type {
  AggregateRating,
  HowToSection,
  HowToStep,
  Organization,
  RestrictedDiet,
  WebPage,
  WebSite,
} from 'schema-dts'

import { isPlainObject, isString } from '@/utils'

import type { Graph, Person, Recipe, Thing } from './schema-org.interface'

export function hasId(obj: Thing): obj is Thing & { '@id': string } {
  return '@id' in obj && typeof obj['@id'] === 'string'
}

// Type guards for runtime type checking
export function isGraphType(obj: unknown): obj is Graph {
  return isPlainObject(obj) && '@graph' in obj && Array.isArray(obj['@graph'])
}

export function isBaseType(obj: unknown): obj is { '@type': string } {
  return (
    isPlainObject(obj) && '@type' in obj && (isString(obj['@type']) || Array.isArray(obj['@type']))
  )
}

export function isSchemaOrgData(obj: unknown): obj is Graph | Thing {
  return isGraphType(obj) || isBaseType(obj)
}

export function isThingType<T extends Thing>(
  obj: unknown,
  type: string,
): obj is Exclude<T, 'string'> {
  if (!isBaseType(obj)) return false

  const thingType = Array.isArray(obj['@type']) ? obj['@type'][0] : obj['@type']

  return thingType === type
}

export function isAggregateRating(obj: unknown): obj is AggregateRating {
  return isThingType(obj, 'AggregateRating')
}

export function isHowToSection(obj: unknown): obj is HowToSection {
  return isThingType(obj, 'HowToSection')
}

export function isHowToStep(obj: unknown): obj is HowToStep {
  return isThingType(obj, 'HowToStep')
}

export function isOrganization(obj: unknown): obj is Organization {
  return isThingType(obj, 'Organization')
}

export function isPerson(obj: unknown): obj is Person {
  return isThingType(obj, 'Person')
}

export function isRecipe(obj: unknown): obj is Recipe {
  return isThingType(obj, 'Recipe')
}

export function isRestrictedDiet(obj: unknown): obj is RestrictedDiet {
  return isThingType(obj, 'RestrictedDiet')
}

export function isWebPage(obj: unknown): obj is WebPage {
  return isThingType(obj, 'WebPage')
}

export function isWebSite(obj: unknown): obj is WebSite {
  return isThingType(obj, 'WebSite')
}
