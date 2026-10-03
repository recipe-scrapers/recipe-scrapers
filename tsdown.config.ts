import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    schema: './src/schema.ts',
    utils: './src/utils-entry.ts',
  },
  outDir: 'dist',
  format: 'esm',
  dts: true,
  sourcemap: true,
  deps: {
    neverBundle: true,
  },
})
