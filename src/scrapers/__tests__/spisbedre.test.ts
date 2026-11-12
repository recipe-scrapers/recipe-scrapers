import { describe, expect, it } from 'bun:test'

import { LogLevel } from '@/logger'
import { SpisBedre } from '@/scrapers/spisbedre'

function pageHtml(recipe: Record<string, unknown>): string {
  const payload = JSON.stringify({ props: { recipe } }).replaceAll('"', '&quot;')
  return `<html><body><div id="app" data-page="${payload}"></div></body></html>`
}

function ingredient(amount: number | null, overrides: Record<string, unknown> = {}) {
  return {
    amount,
    unit_id: 1,
    unit_inflection: 'default',
    unit: { name_singular: 'gram', name_plural: 'gram', abbreviation: 'g' },
    ingredient_inflection: 'default',
    ingredient: { name_singular: 'løg', name_plural: 'løg' },
    prefix: null,
    suffix: null,
    ...overrides,
  }
}

async function ingredientValues(recipe: Record<string, unknown>) {
  const scraper = new SpisBedre(pageHtml(recipe), 'spisbedre.dk', { logLevel: LogLevel.ERROR })
  const groups = await scraper.extract('ingredients')
  return groups.flatMap((group) => group.items.map((item) => item.value))
}

describe('SpisBedre', () => {
  it('scales amounts by serving size and formats them like the site', async () => {
    const values = await ingredientValues({
      serving_size: 2,
      grouped_ingredients: [
        {
          title: null,
          ingredients: [
            ingredient(5.25),
            ingredient(0.65),
            ingredient(0.125),
            ingredient(null, { unit: null }),
          ],
        },
      ],
    })

    expect(values).toEqual(['10½ g løg', '1,3 g løg', '¼ g løg', 'løg'])
  })

  it('hides unit 21 and inflects names from the scaled amount', async () => {
    const values = await ingredientValues({
      serving_size: 1,
      grouped_ingredients: [
        {
          title: 'Fyld',
          ingredients: [
            ingredient(1, {
              unit_id: 21,
              ingredient: { name_singular: 'æble', name_plural: 'æbler' },
            }),
            ingredient(3, {
              unit: { name_singular: 'fed', name_plural: 'feds', abbreviation: null },
              prefix: 'store',
              suffix: 'hakket',
            }),
          ],
        },
      ],
    })

    expect(values).toEqual(['1 æble', '3 feds store løg hakket'])
  })

  it('reports yields as items when the serving unit is not persons', async () => {
    const scraper = new SpisBedre(
      pageHtml({ serving_size: 12, serving_size_unit_id: 4 }),
      'spisbedre.dk',
      { logLevel: LogLevel.ERROR },
    )

    expect(await scraper.extract('yields')).toBe('12 items')
  })
})
