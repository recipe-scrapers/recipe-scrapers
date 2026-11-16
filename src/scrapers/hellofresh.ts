import { AbstractScraper } from '@/abstract-scraper'

/**
 * HelloFresh publishes the same Schema.org markup on every country domain,
 * so this class only exists to register those domains as aliases.
 */
export class HelloFresh extends AbstractScraper {
  static host() {
    return 'hellofresh.com'
  }
}

/** HelloFresh's country domains other than hellofresh.com. */
export const HELLOFRESH_COUNTRY_HOSTS = [
  'hellofresh.at',
  'hellofresh.be',
  'hellofresh.ca',
  'hellofresh.ch',
  'hellofresh.co.nz',
  'hellofresh.co.uk',
  'hellofresh.com.au',
  'hellofresh.de',
  'hellofresh.dk',
  'hellofresh.es',
  'hellofresh.fr',
  'hellofresh.ie',
  'hellofresh.it',
  'hellofresh.lu',
  'hellofresh.nl',
  'hellofresh.no',
  'hellofresh.se',
] as const
