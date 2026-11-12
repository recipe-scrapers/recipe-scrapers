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
 * `--dist <dir>` and `--budgets <file>` override the defaults (`dist/` and
 * `bundle-size-budgets.json`).
 *
 * Prints a Markdown table, so CI can append it to the job summary. Exits 1
 * when an entry is over its gzip budget, has no budget, or the budgets file
 * names an entry that does not exist.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

import { z } from 'zod'

const ROOT = path.resolve(import.meta.dir, '..')
const HEADROOM = 1.1

/** Published entry name to its built file in `dist/`. */
export const ENTRIES: ReadonlyMap<string, string> = new Map([
  ['index', 'index.mjs'],
  ['schema', 'schema.mjs'],
  ['utils', 'utils.mjs'],
])

export type Size = { raw: number; gzip: number; brotli: number }
export type Sizes = ReadonlyMap<string, Size>
export type Budgets = Readonly<Record<string, number>>

export type BudgetCheck = {
  /** Entries whose gzip size exceeds their budget. */
  over: string[]
  /** Entries with no budget. */
  missing: string[]
  /** Budget keys that match no entry. */
  unknown: string[]
}

const BudgetsSchema = z.record(z.string(), z.number().int().positive())

const PackageJsonSchema = z.object({
  peerDependencies: z.record(z.string(), z.string()).default({}),
})

/** Formats a byte count as `B` below 1 KiB and as `KB` with one decimal above. */
export function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

/** Formats the change from `base` to `current`, or nothing when there is no base. */
export function formatDelta(current: number, base: number | undefined): string {
  if (base === undefined) return ''
  const delta = current - base
  if (delta === 0) return ' (no change)'
  const sign = delta > 0 ? '+' : '-'
  return ` (${sign}${formatBytes(Math.abs(delta))}, ${sign}${Math.abs((delta / base) * 100).toFixed(1)}%)`
}

/** Budgets of each entry's gzip size plus headroom, rounded up to 100 bytes. */
export function computeBudgets(sizes: Sizes, headroom = HEADROOM): Record<string, number> {
  return Object.fromEntries(
    [...sizes].map(([entry, size]) => [entry, Math.ceil((size.gzip * headroom) / 100) * 100]),
  )
}

/** Compares measured sizes with budgets. Any non-empty list fails the check. */
export function checkBudgets(sizes: Sizes, budgets: Budgets): BudgetCheck {
  return {
    over: [...sizes]
      .filter(([entry, size]) => Object.hasOwn(budgets, entry) && size.gzip > budgets[entry])
      .map(([entry]) => entry),
    missing: [...sizes.keys()].filter((entry) => !Object.hasOwn(budgets, entry)),
    unknown: Object.keys(budgets).filter((entry) => !sizes.has(entry)),
  }
}

/** Explains a failed check and how to fix it, or returns undefined when it passed. */
export function formatFailures({ over, missing, unknown }: BudgetCheck): string | undefined {
  const lines = [
    over.length > 0 &&
      `${over.join(', ')} over gzip budget. If the growth is intended, run \`bun run size --update-budgets\` and say why in the commit.`,
    missing.length > 0 &&
      `${missing.join(', ')} has no gzip budget. Run \`bun run size --update-budgets\` to add one.`,
    unknown.length > 0 &&
      `Budget for unknown entry ${unknown.join(', ')}. Remove it, or run \`bun run size --update-budgets\`.`,
  ].filter((line) => line !== false)

  return lines.length > 0 ? lines.join('\n') : undefined
}

/** Renders the Markdown report for the CI job summary. */
export function renderReport(options: {
  current: Sizes
  base?: Sizes
  budgets: Budgets
  check: BudgetCheck
  peerDependencies: string[]
}): string {
  const { current, base, budgets, check, peerDependencies } = options

  const rows = [...current].map(([entry, size]) => {
    const baseSize = base?.get(entry)
    const budget = Object.hasOwn(budgets, entry)
      ? `${formatBytes(budgets[entry])}${check.over.includes(entry) ? ' **over**' : ''}`
      : '**missing**'

    return [
      `\`${entry}\``,
      formatBytes(size.raw) + formatDelta(size.raw, baseSize?.raw),
      formatBytes(size.gzip) + formatDelta(size.gzip, baseSize?.gzip),
      formatBytes(size.brotli) + formatDelta(size.brotli, baseSize?.brotli),
      budget,
    ]
  })

  return [
    `### Bundle size${base ? ' (change from base)' : ''}`,
    '',
    '| Entry | Minified | Gzip | Brotli | Gzip budget |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map((cells) => `| ${cells.join(' | ')} |`),
    '',
    `Peer dependencies (${peerDependencies.join(', ')}) are external; runtime dependencies are included.`,
  ].join('\n')
}

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

async function measureBuild(distDir: string, external: string[]): Promise<Sizes> {
  const sizes = new Map<string, Size>()

  for (const [entry, file] of ENTRIES) {
    sizes.set(entry, await measureEntry(distDir, file, external))
  }

  return sizes
}

async function main(): Promise<number> {
  const { values: args } = parseArgs({
    options: {
      base: { type: 'string' },
      budgets: { type: 'string', default: path.join(ROOT, 'bundle-size-budgets.json') },
      dist: { type: 'string', default: path.join(ROOT, 'dist') },
      'update-budgets': { type: 'boolean', default: false },
    },
  })

  const packageJson = PackageJsonSchema.parse(
    JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8')),
  )
  const peerDependencies = Object.keys(packageJson.peerDependencies)
  // Match subpath imports such as `cheerio/slim` as well as the bare package.
  const external = peerDependencies.flatMap((name) => [name, `${name}/*`])

  const current = await measureBuild(path.resolve(args.dist), external)
  const base = args.base ? await measureBuild(path.resolve(args.base), external) : undefined

  if (args['update-budgets']) {
    await writeFile(args.budgets, `${JSON.stringify(computeBudgets(current), null, 2)}\n`)
    console.log(`Wrote ${path.relative(process.cwd(), args.budgets)}`)
  }

  const budgets = BudgetsSchema.parse(JSON.parse(await readFile(args.budgets, 'utf8')))
  const check = checkBudgets(current, budgets)

  console.log(renderReport({ current, base, budgets, check, peerDependencies }))

  const failures = formatFailures(check)
  if (failures === undefined) return 0

  console.error(`\n${failures}`)
  return 1
}

if (import.meta.main) {
  process.exitCode = await main()
}
