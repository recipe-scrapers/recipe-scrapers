/**
 * Measures what each published entry adds to a consumer's bundle: the built
 * entry from `dist/`, bundled and minified with peer dependencies left
 * external (consumers already ship them) and runtime dependencies included.
 *
 * Usage:
 *   bun scripts/bundle-size.ts                  report sizes, check budgets
 *   bun scripts/bundle-size.ts --base <dist>    also show the change from another build
 *   bun scripts/bundle-size.ts --update-budgets reset budgets to current size plus headroom
 *
 * Prints a Markdown table, so CI can append it to the job summary. Exits 1
 * when an entry's gzip size is over its budget in `bundle-size-budgets.json`.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

import { z } from 'zod'

const ROOT = path.resolve(import.meta.dir, '..')
const BUDGETS_FILE = path.join(ROOT, 'bundle-size-budgets.json')
const HEADROOM = 1.1

/** Published entry name to its built file in `dist/`. */
const ENTRIES = new Map([
  ['index', 'index.mjs'],
  ['schema', 'schema.mjs'],
  ['utils', 'utils.mjs'],
])

type Size = { raw: number; gzip: number; brotli: number }

const BudgetsSchema = z.record(z.string(), z.number().int().positive())

const PackageJsonSchema = z.object({
  peerDependencies: z.record(z.string(), z.string()).default({}),
})

async function measureEntry(distDir: string, file: string, external: string[]): Promise<Size> {
  const result = await Bun.build({
    entrypoints: [path.join(distDir, file)],
    external,
    minify: true,
    target: 'browser',
  })

  if (!result.success) {
    throw new AggregateError(result.logs, `Failed to bundle ${file}`)
  }

  const code = Buffer.from(await result.outputs[0].arrayBuffer())

  return {
    raw: code.byteLength,
    gzip: gzipSync(code, { level: 9 }).byteLength,
    brotli: brotliCompressSync(code, {
      params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY },
    }).byteLength,
  }
}

async function measureBuild(distDir: string, external: string[]) {
  const sizes = new Map<string, Size>()

  for (const [entry, file] of ENTRIES) {
    sizes.set(entry, await measureEntry(distDir, file, external))
  }

  return sizes
}

function formatBytes(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

function formatDelta(current: number, base: number | undefined) {
  if (base === undefined) return ''
  const delta = current - base
  if (delta === 0) return ' (no change)'
  const sign = delta > 0 ? '+' : '-'
  return ` (${sign}${formatBytes(Math.abs(delta))}, ${sign}${Math.abs((delta / base) * 100).toFixed(1)}%)`
}

const { values: args } = parseArgs({
  options: {
    base: { type: 'string' },
    'update-budgets': { type: 'boolean', default: false },
  },
})

const packageJson = PackageJsonSchema.parse(
  JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8')),
)
// Match subpath imports such as `cheerio/slim` as well as the bare package.
const external = Object.keys(packageJson.peerDependencies).flatMap((name) => [name, `${name}/*`])

const current = await measureBuild(path.join(ROOT, 'dist'), external)
const base = args.base ? await measureBuild(path.resolve(args.base), external) : undefined

if (args['update-budgets']) {
  const budgets = Object.fromEntries(
    [...current].map(([entry, size]) => [entry, Math.ceil((size.gzip * HEADROOM) / 100) * 100]),
  )
  await writeFile(BUDGETS_FILE, `${JSON.stringify(budgets, null, 2)}\n`)
  console.log(`Wrote ${path.relative(ROOT, BUDGETS_FILE)}`)
}

const budgets = BudgetsSchema.parse(JSON.parse(await readFile(BUDGETS_FILE, 'utf8')))
const overBudget: string[] = []

const rows = [...current].map(([entry, size]) => {
  const baseSize = base?.get(entry)
  const budget = budgets[entry]
  const over = budget !== undefined && size.gzip > budget
  if (over) overBudget.push(entry)

  return [
    `\`${entry}\``,
    formatBytes(size.raw) + formatDelta(size.raw, baseSize?.raw),
    formatBytes(size.gzip) + formatDelta(size.gzip, baseSize?.gzip),
    formatBytes(size.brotli) + formatDelta(size.brotli, baseSize?.brotli),
    budget === undefined ? 'none' : `${formatBytes(budget)}${over ? ' **over**' : ''}`,
  ]
})

console.log(
  [
    `### Bundle size${base ? ' (change from base)' : ''}`,
    '',
    '| Entry | Minified | Gzip | Brotli | Gzip budget |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map((cells) => `| ${cells.join(' | ')} |`),
    '',
    `Peer dependencies (${Object.keys(packageJson.peerDependencies).join(', ')}) are external; runtime dependencies are included.`,
  ].join('\n'),
)

if (overBudget.length > 0) {
  console.error(
    `\n${overBudget.join(', ')} over gzip budget. If the growth is intended, run \`bun run size --update-budgets\` and say why in the commit.`,
  )
  process.exit(1)
}
