import { benchPage } from './bench-page'

// Largest page (about 2 MB), with an embedded JSON payload.
benchPage('weightwatchers.com/weightwatcherspublic_2', {
  fallbackDescription: 'No description provided',
})
