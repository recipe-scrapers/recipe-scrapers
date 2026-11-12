import { benchPage } from './bench-page'

// Custom Scraper with ingredient parsing and notes.
benchPage('cooking.nytimes.com/nytimes_notes', { parseIngredients: true, parseNotes: true })
