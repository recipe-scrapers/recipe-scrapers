import type { AbstractScraper } from '@/abstract-scraper'
import { AllRecipes } from './allrecipes'
import { AmericasTestKitchen } from './americastestkitchen'
import { BBCGoodFood } from './bbcgoodfood'
import { CookieAndKate } from './cookieandkate'
import { EatingWell } from './eatingwell'
import { Epicurious } from './epicurious'
import { KingArthur } from './kingarthur'
import { LoveAndLemons } from './loveandlemons'
import { MinimalistBaker } from './minimalistbaker'
import { NYTimes } from './nytimes'
import { PinchOfYum } from './pinchofyum'
import { SallysBakingAddiction } from './sallysbakingaddiction'
import { SeriousEats } from './seriouseats'
import { SimplyRecipes } from './simplyrecipes'
import { ThePioneerWoman } from './thepioneerwoman'

/**
 * A map of all scrapers.
 */
export const scrapers = {
  [AllRecipes.host()]: AllRecipes,
  [AmericasTestKitchen.host()]: AmericasTestKitchen,
  [BBCGoodFood.host()]: BBCGoodFood,
  [CookieAndKate.host()]: CookieAndKate,
  [EatingWell.host()]: EatingWell,
  [Epicurious.host()]: Epicurious,
  [KingArthur.host()]: KingArthur,
  [LoveAndLemons.host()]: LoveAndLemons,
  [MinimalistBaker.host()]: MinimalistBaker,
  [NYTimes.host()]: NYTimes,
  [PinchOfYum.host()]: PinchOfYum,
  [SallysBakingAddiction.host()]: SallysBakingAddiction,
  [SeriousEats.host()]: SeriousEats,
  [SimplyRecipes.host()]: SimplyRecipes,
  [ThePioneerWoman.host()]: ThePioneerWoman,
} as const satisfies Record<string, typeof AbstractScraper>
