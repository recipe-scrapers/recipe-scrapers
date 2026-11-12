import { fileURLToPath } from 'node:url'

import codspeedPlugin from '@codspeed/vitest-plugin'
import { defineConfig } from 'vitest/config'

// Vitest runs only the CodSpeed benchmarks; unit tests run on `bun test`.
export default defineConfig({
  plugins: [codspeedPlugin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: [],
    benchmark: { include: ['bench/**/*.bench.ts'] },
    // CodSpeed simulation runs each benchmark 8 times under instrumentation,
    // so one page can take several minutes.
    testTimeout: 15 * 60_000,
  },
})
