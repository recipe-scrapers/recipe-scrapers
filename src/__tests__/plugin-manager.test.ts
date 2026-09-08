import { describe, expect, it } from 'bun:test'

import type { ExtractorPlugin } from '../abstract-extractor-plugin'
import type { PostProcessorPlugin } from '../abstract-postprocessor-plugin'
import { PluginManager } from '../plugin-manager'

describe('PluginManager', () => {
  const makeExtractor = (name: string, priority: number): ExtractorPlugin =>
    ({ name, priority }) as ExtractorPlugin

  const makePostProcessor = (
    name: string,
    priority: number,
  ): PostProcessorPlugin => ({ name, priority }) as PostProcessorPlugin

  it('sorts base extractors by priority descending', () => {
    const low = makeExtractor('low', 1)
    const high = makeExtractor('high', 10)
    const manager = new PluginManager([low, high], [], [], [])
    const names = manager.getExtractors().map((p) => p.name)
    expect(names).toEqual(['high', 'low'])
  })

  it('includes extra extractors and sorts them with base', () => {
    const base = makeExtractor('base', 5)
    const extra = makeExtractor('extra', 15)
    const manager = new PluginManager([base], [], [extra], [])
    const names = manager.getExtractors().map((p) => p.name)
    expect(names).toEqual(['extra', 'base'])
  })

  it('returns empty array when no extractors provided', () => {
    const manager = new PluginManager([], [], [], [])
    expect(manager.getExtractors()).toEqual([])
  })

  it('sorts base post-processors by priority descending', () => {
    const a = makePostProcessor('A', 2)
    const b = makePostProcessor('B', 8)
    const manager = new PluginManager([], [a, b], [], [])
    const names = manager.getPostProcessors().map((p) => p.name)
    expect(names).toEqual(['B', 'A'])
  })

  it('includes extra post-processors and sorts them with base', () => {
    const base = makePostProcessor('basePP', 3)
    const extra = makePostProcessor('extraPP', 20)
    const manager = new PluginManager([], [base], [], [extra])
    const names = manager.getPostProcessors().map((p) => p.name)
    expect(names).toEqual(['extraPP', 'basePP'])
  })

  it('returns empty array when no post-processors provided', () => {
    const manager = new PluginManager([], [], [], [])
    expect(manager.getPostProcessors()).toEqual([])
  })

  it('maintains separate extractor and post-processor lists', () => {
    const ext = makeExtractor('ext', 7)
    const pp = makePostProcessor('pp', 4)
    const manager = new PluginManager([ext], [pp], [], [])
    expect(manager.getExtractors().map((p) => p.name)).toEqual(['ext'])
    expect(manager.getPostProcessors().map((p) => p.name)).toEqual(['pp'])
  })
})
