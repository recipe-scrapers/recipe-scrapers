import type { AbstractScraper } from '@/abstract-scraper'
import { AllRecipes } from './allrecipes'
import { AmericasTestKitchen } from './americastestkitchen'
import { BBCGoodFood } from './bbcgoodfood'
import { BonAppetit } from './bonappetit'
import { CookPad } from './cookpad'
import { Delish } from './delish'
import { EatingWell } from './eatingwell'
import { Epicurious } from './epicurious'
import { Food52 } from './food52'
import { NYTimes } from './nytimes'
import { SeriousEats } from './seriouseats'
import { SimplyRecipes } from './simplyrecipes'
import { Tasty } from './tasty'

/**
 * A map of all scrapers.
 */
export const scrapers = {
  [AllRecipes.host()]: AllRecipes,
  [AmericasTestKitchen.host()]: AmericasTestKitchen,
  [BBCGoodFood.host()]: BBCGoodFood,
  [BonAppetit.host()]: BonAppetit,
  [CookPad.host()]: CookPad,
  [Delish.host()]: Delish,
  [EatingWell.host()]: EatingWell,
  [Epicurious.host()]: Epicurious,
  [Food52.host()]: Food52,
  [SeriousEats.host()]: SeriousEats,
  [SimplyRecipes.host()]: SimplyRecipes,
  [NYTimes.host()]: NYTimes,
  [Tasty.host()]: Tasty,
} as const satisfies Record<string, typeof AbstractScraper>
