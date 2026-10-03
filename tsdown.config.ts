import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts', './src/schema.ts'],
  outDir: 'dist',
  format: 'esm',
  dts: true,
  sourcemap: true,
  deps: {
    neverBundle: true,
  },
})
