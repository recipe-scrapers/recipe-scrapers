import { AbstractScraper, type ScraperExtractors } from '@/abstract-scraper'
import type { RecipeFields } from '@/types/recipe.interface'
import { normalizeString } from '@/utils/parsing'

export class Skinnytaste extends AbstractScraper {
  static host() {
    return 'skinnytaste.com'
  }

  protected override readonly extractors = {
    equipment: this.equipment.bind(this),
  } satisfies ScraperExtractors

  protected equipment(): RecipeFields['equipment'] {
    const equipmentItems = this.$(
      '.wprm-recipe-equipment-item .wprm-recipe-equipment-name',
    )
      .map((_, el) => normalizeString(this.$(el).text()))
      .get()
      .filter((item) => item.length > 0)

    return new Set(equipmentItems)
  }
}
