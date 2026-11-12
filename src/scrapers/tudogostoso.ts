import { AbstractScraper } from '@/abstract-scraper'

export class TudoGostoso extends AbstractScraper {
  static host() {
    return 'tudogostoso.com.br'
  }

  protected override readonly ingredientGroupStructure = {
    heading: '.recipe-ingredients-subtitle',
    item: '.recipe-ingredients-item',
  }
}
