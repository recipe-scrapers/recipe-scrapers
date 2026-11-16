import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { scrapeRecipe } from '@/index'

const fixture = readFileSync(
  path.resolve(
    import.meta.dirname,
    '../../../test-data/joshuaweissman.com/joshuaweissman.testhtml',
  ),
  'utf8',
)

describe('JoshuaWeissman', () => {
  it("uses the caller's fallbackYield when the post states no serving size", async () => {
    const html = fixture.replaceAll(/serving size/gi, 'Feeds')

    const recipe = await scrapeRecipe(html, 'https://www.joshuaweissman.com/post/burrito', {
      fallbackYield: 'Yield not specified',
    })

    expect(recipe.yields).toBe('Yield not specified')
  })
})
