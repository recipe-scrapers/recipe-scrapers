import { AbstractScraper } from '@/abstract-scraper'

/**
 * Scraper for kingarthurbaking.com. The Structured Data instructions are one
 * HTML string of `<p>` steps joined with ", ", which generic splitting breaks
 * apart at sentences. The page lists each step as its own paragraph, beside
 * "Learn more" asides that are not part of the step.
 */
export class KingArthur extends AbstractScraper {
  static host() {
    return 'kingarthurbaking.com'
  }

  protected override readonly instructionStructure = {
    item: '.field--recipe-steps li > p',
  }
}
