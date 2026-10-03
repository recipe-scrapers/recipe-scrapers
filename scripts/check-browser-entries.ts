import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const DIST_DIR = path.resolve(import.meta.dir, '../dist')
const RELATIVE_MODULE_PATTERN = /\b(?:import|export)(?:\s+[^'"]*?\s+from)?\s*['"](\.[^'"]+)['"]/g
const DYNAMIC_IMPORT_PATTERN = /\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g
const CHEERIO_IMPORT_PATTERN = /\b(?:from\s*|import\s*(?:\(\s*)?)['"]cheerio(?:\/[^'"]*)?['"]/

async function collectReachableModules(entryFile: string): Promise<Map<string, string>> {
  const modules = new Map<string, string>()
  const pending = [entryFile]

  while (pending.length > 0) {
    const file = pending.pop()
    if (!file || modules.has(file)) continue

    const source = await readFile(file, 'utf8')
    modules.set(file, source)

    const specifiers = [
      ...source.matchAll(RELATIVE_MODULE_PATTERN),
      ...source.matchAll(DYNAMIC_IMPORT_PATTERN),
    ]

    for (const match of specifiers) {
      const specifier = match[1]
      if (specifier) pending.push(path.resolve(path.dirname(file), specifier))
    }
  }

  return modules
}

const cheerioImports: string[] = []

for (const entry of ['schema.mjs', 'utils.mjs']) {
  const modules = await collectReachableModules(path.join(DIST_DIR, entry))

  cheerioImports.push(
    ...[...modules.entries()]
      .filter(([, source]) => CHEERIO_IMPORT_PATTERN.test(source))
      .map(([file]) => path.relative(DIST_DIR, file)),
  )
}

assert.deepEqual(cheerioImports, [], 'Browser-safe entries must not import Cheerio')
