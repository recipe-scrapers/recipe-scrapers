import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  checkBudgets,
  computeBudgets,
  ENTRIES,
  formatDelta,
  formatFailures,
  renderReport,
  type Sizes,
} from '../bundle-size'

const SCRIPT = path.resolve(import.meta.dir, '../bundle-size.ts')

function sizes(gzipByEntry: Record<string, number>): Sizes {
  return new Map(
    Object.entries(gzipByEntry).map(([entry, gzip]) => [
      entry,
      { raw: gzip * 3, gzip, brotli: gzip - 10 },
    ]),
  )
}

describe('checkBudgets', () => {
  it('passes when every entry is within its budget', () => {
    const check = checkBudgets(sizes({ index: 1000, utils: 100 }), { index: 1000, utils: 200 })
    expect(check).toEqual({ over: [], missing: [], unknown: [] })
    expect(formatFailures(check)).toBeUndefined()
  })

  it('fails an entry over its budget', () => {
    const check = checkBudgets(sizes({ index: 1001, utils: 100 }), { index: 1000, utils: 200 })
    expect(check.over).toEqual(['index'])
    expect(formatFailures(check)).toContain('index over gzip budget')
  })

  it('fails an entry with no budget instead of skipping it', () => {
    const check = checkBudgets(sizes({ index: 1000, utils: 100 }), { index: 2000 })
    expect(check.missing).toEqual(['utils'])
    expect(formatFailures(check)).toContain('utils has no gzip budget')
  })

  it('fails a budget for an entry that does not exist', () => {
    const check = checkBudgets(sizes({ index: 1000 }), { index: 2000, removed: 500 })
    expect(check.unknown).toEqual(['removed'])
    expect(formatFailures(check)).toContain('unknown entry removed')
  })
})

describe('computeBudgets', () => {
  it('adds 10% headroom and rounds up to 100 bytes', () => {
    expect(computeBudgets(sizes({ index: 21_200, utils: 682 }))).toEqual({
      index: 23_400,
      utils: 800,
    })
  })
})

describe('formatDelta', () => {
  it('shows growth, shrinkage, and no change', () => {
    expect(formatDelta(1536, 1024)).toBe(' (+512 B, +50.0%)')
    expect(formatDelta(512, 1024)).toBe(' (-512 B, -50.0%)')
    expect(formatDelta(1024, 1024)).toBe(' (no change)')
    expect(formatDelta(1024, undefined)).toBe('')
  })
})

describe('renderReport', () => {
  it('shows the change from base and marks failing budgets', () => {
    const current = sizes({ index: 2048, utils: 100 })
    const budgets = { index: 1024 }
    const report = renderReport({
      current,
      base: sizes({ index: 1024, utils: 100 }),
      budgets,
      check: checkBudgets(current, budgets),
      peerDependencies: ['cheerio'],
    })

    expect(report).toContain('### Bundle size (change from base)')
    expect(report).toContain('| `index` | 6.0 KB (+3.0 KB, +100.0%) | 2.0 KB (+1.0 KB, +100.0%)')
    expect(report).toContain('1.0 KB **over** |')
    expect(report).toContain(
      '| `utils` | 300 B (no change) | 100 B (no change) | 90 B (no change) | **missing** |',
    )
  })
})

describe('bundle-size command', () => {
  let dir: string

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'bundle-size-'))
    await Promise.all(
      [...ENTRIES.values()].map((file) =>
        writeFile(path.join(dir, file), `export const value = ${JSON.stringify(file)}\n`),
      ),
    )
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  async function run(budgets: Record<string, number> | undefined, ...args: string[]) {
    const budgetsFile = path.join(dir, 'budgets.json')
    if (budgets) await writeFile(budgetsFile, JSON.stringify(budgets))

    const proc = Bun.spawn(['bun', SCRIPT, '--dist', dir, '--budgets', budgetsFile, ...args], {
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])

    return { stdout, stderr, exitCode, budgetsFile }
  }

  it('exits 0 when every entry is within budget', async () => {
    const { exitCode, stdout } = await run({ index: 1000, schema: 1000, utils: 1000 })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('| `index` |')
  })

  it('exits 1 when an entry is over budget', async () => {
    const { exitCode, stderr } = await run({ index: 1, schema: 1000, utils: 1000 })
    expect(exitCode).toBe(1)
    expect(stderr).toContain('index over gzip budget')
  })

  it('exits 1 when an entry has no budget', async () => {
    const { exitCode, stderr } = await run({ index: 1000, schema: 1000 })
    expect(exitCode).toBe(1)
    expect(stderr).toContain('utils has no gzip budget')
  })

  it('writes passing budgets with --update-budgets', async () => {
    const { exitCode, budgetsFile } = await run({ index: 1 }, '--update-budgets')
    expect(exitCode).toBe(0)
    expect(Object.keys(JSON.parse(await readFile(budgetsFile, 'utf8')))).toEqual([
      ...ENTRIES.keys(),
    ])
  })

  it('reports the change from --base', async () => {
    const { exitCode, stdout } = await run(
      { index: 1000, schema: 1000, utils: 1000 },
      '--base',
      dir,
    )
    expect(exitCode).toBe(0)
    expect(stdout).toContain('(change from base)')
    expect(stdout).toContain('(no change)')
  })
})
