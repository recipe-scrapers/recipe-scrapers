import { DotdashMeredithScraper } from './dotdashmeredith'

export class FoodAndWine extends DotdashMeredithScraper {
  static host() {
    return 'foodandwine.com'
  }
}
