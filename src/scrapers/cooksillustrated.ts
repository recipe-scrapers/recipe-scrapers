import type { RecipeFields } from '@/types/recipe.interface'

import { AmericasTestKitchen } from './americastestkitchen'

/**
 * Cook's Illustrated is an America's Test Kitchen site that serves the same
 * Next.js page data, so it reuses that Scraper with its own Host and site name.
 */
export class CooksIllustrated extends AmericasTestKitchen {
  static override host() {
    return 'cooksillustrated.com'
  }

  protected override siteName(): RecipeFields['siteName'] {
    return "Cook's Illustrated"
  }
}
