import type { Cheerio, CheerioAPI } from 'cheerio'
import type { Element } from 'domhandler'

interface MicrodataObject {
  '@type'?: string
  [key: string]: unknown
}

const addProperty = (obj: Record<string, unknown>, key: string, value: unknown) => {
  if (obj[key] === undefined) {
    obj[key] = value
  } else if (Array.isArray(obj[key])) {
    obj[key].push(value)
  } else {
    obj[key] = [obj[key], value]
  }
}

const extractValueFromElement = <T extends Element>(element: Cheerio<T>): string | undefined => {
  if (element.is('meta')) {
    return element.attr('content')
  }

  if (element.is('time')) {
    return element.attr('datetime') || element.text().trim()
  }

  if (element.is('img')) {
    return element.attr('src')
  }

  if (element.is('a')) {
    return element.attr('href')
  }

  return element.text().trim()
}

const extractSchemaType = (itemType: string): string | undefined => {
  const typeMatch = itemType.match(/schema\.org\/(\w+)/)
  return typeMatch?.[1]
}

/**
 * Extracts microdata from HTML elements using itemtype and itemprop attributes
 *
 * @param $ - Cheerio instance
 * @param selector - Selector to find elements with microdata
 * @returns Array of extracted microdata objects
 */
export function extractMicrodata($: CheerioAPI, selector: string): MicrodataObject[] {
  const results: MicrodataObject[] = []
  const elements = $(selector)

  elements.each((_, el) => {
    const $element = $(el)
    const itemType = $element.attr('itemtype')
    const rootObject: MicrodataObject = {}

    // Set the schema type if available
    if (itemType) {
      const schemaType = extractSchemaType(itemType)
      if (schemaType) {
        rootObject['@type'] = schemaType
      }
    }

    // Also get itemprop elements that are not inside nested itemtype elements
    const allProps = $element.find('[itemprop]').addBack('[itemprop]')
    const nestedItemTypes = $element.find('[itemtype]')

    // Filter out properties that are inside nested itemtype elements
    const rootLevelProps = allProps.filter((_, propEl) => {
      const $prop = $(propEl as Element)

      // If this element itself has itemtype, it's a nested object
      if ($prop.attr('itemtype')) {
        return true
      }

      // Check if this property is inside any nested itemtype element
      const isInsideNestedType = nestedItemTypes
        .toArray()
        .some((nestedEl) => $(nestedEl as Element).find($prop).length > 0)

      return !isInsideNestedType
    })

    rootLevelProps.each((_, propEl) => {
      const $prop = $(propEl as Element)
      const propName = $prop.attr('itemprop')
      if (!propName) return

      let propValue: string | MicrodataObject | undefined

      // Check if this element has an itemtype (nested object)
      const nestedItemType = $prop.attr('itemtype')
      if (nestedItemType) {
        const nestedObject: MicrodataObject = {}

        // Set nested schema type
        const nestedSchemaType = extractSchemaType(nestedItemType)
        if (nestedSchemaType) {
          nestedObject['@type'] = nestedSchemaType
        }

        // Extract properties from nested object (only direct children)
        $prop.find('[itemprop]').each((_, nestedEl) => {
          const $nested = $(nestedEl as Element)
          const nestedProp = $nested.attr('itemprop')
          if (!nestedProp) return

          const nestedValue = extractValueFromElement($nested)
          if (nestedValue && nestedValue !== '') {
            addProperty(nestedObject, nestedProp, nestedValue)
          }
        })

        propValue = nestedObject
      } else {
        // Handle simple property values
        propValue = extractValueFromElement($prop)
      }

      if (propValue !== undefined && propValue !== '') {
        addProperty(rootObject, propName, propValue)
      }
    })

    // Only add objects that have properties beyond just @type
    if (
      Object.keys(rootObject).length > 1 ||
      (Object.keys(rootObject).length === 1 && !rootObject['@type'])
    ) {
      results.push(rootObject)
    }
  })

  return results
}

/**
 * Extracts Recipe microdata specifically
 *
 * @param $ - Cheerio instance
 * @returns Array of recipe microdata objects
 */
export function extractRecipeMicrodata($: CheerioAPI): MicrodataObject[] {
  return extractMicrodata($, '[itemtype*="schema.org/Recipe"], [itemtype*="Recipe"]')
}
