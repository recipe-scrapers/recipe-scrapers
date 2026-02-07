import type { AbstractScraper } from '@/abstract-scraper'
import { AllRecipes } from './allrecipes'
import { AmericasTestKitchen } from './americastestkitchen'
import { BBCGoodFood } from './bbcgoodfood'
import { BudgetBytes } from './budgetbytes'
import { DamnDelicious } from './damndelicious'
import { EatingWell } from './eatingwell'
import { Epicurious } from './epicurious'
import { Food } from './food'
import { HalfBakedHarvest } from './halfbakedharvest'
import { Marmiton } from './marmiton'
import { NYTimes } from './nytimes'
import { RecipeTinEats } from './recipetineats'
import { SeriousEats } from './seriouseats'
import { SimplyRecipes } from './simplyrecipes'
import { SkinnyTaste } from './skinnytaste'

/**
 * A map of all scrapers.
 */
export const scrapers = {
  [AllRecipes.host()]: AllRecipes,
  [AmericasTestKitchen.host()]: AmericasTestKitchen,
  [BBCGoodFood.host()]: BBCGoodFood,
  [BudgetBytes.host()]: BudgetBytes,
  [DamnDelicious.host()]: DamnDelicious,
  [EatingWell.host()]: EatingWell,
  [Epicurious.host()]: Epicurious,
  [Food.host()]: Food,
  [HalfBakedHarvest.host()]: HalfBakedHarvest,
  [Marmiton.host()]: Marmiton,
  [NYTimes.host()]: NYTimes,
  [RecipeTinEats.host()]: RecipeTinEats,
  [SeriousEats.host()]: SeriousEats,
  [SimplyRecipes.host()]: SimplyRecipes,
  [SkinnyTaste.host()]: SkinnyTaste,
} as const satisfies Record<string, typeof AbstractScraper>
