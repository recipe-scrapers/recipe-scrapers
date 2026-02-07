import type { AbstractScraper } from '@/abstract-scraper'
import { AllRecipes } from './allrecipes'
import { AmericasTestKitchen } from './americastestkitchen'
import { BBCFood } from './bbcfood'
import { BBCGoodFood } from './bbcgoodfood'
import { CuisineAZ } from './cuisineaz'
import { EatingWell } from './eatingwell'
import { Epicurious } from './epicurious'
import { G750g } from './g750g'
import { Jow } from './jow'
import { NYTimes } from './nytimes'
import { SeriousEats } from './seriouseats'
import { SimplyRecipes } from './simplyrecipes'

/**
 * A map of all scrapers.
 */
export const scrapers = {
  [AllRecipes.host()]: AllRecipes,
  [AmericasTestKitchen.host()]: AmericasTestKitchen,
  [BBCFood.host()]: BBCFood,
  'bbc.co.uk': BBCFood,
  [BBCGoodFood.host()]: BBCGoodFood,
  [CuisineAZ.host()]: CuisineAZ,
  [EatingWell.host()]: EatingWell,
  [Epicurious.host()]: Epicurious,
  [G750g.host()]: G750g,
  [Jow.host()]: Jow,
  [SeriousEats.host()]: SeriousEats,
  [SimplyRecipes.host()]: SimplyRecipes,
  [NYTimes.host()]: NYTimes,
} as const satisfies Record<string, typeof AbstractScraper>
