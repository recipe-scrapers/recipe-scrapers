import type { ExtractorPlugin } from './abstract-extractor-plugin'
import type { PostProcessorPlugin } from './abstract-postprocessor-plugin'

export class PluginManager {
  private extractorPlugins: ExtractorPlugin[]
  private postProcessorPlugins: PostProcessorPlugin[]

  constructor(
    baseExtractors: ExtractorPlugin[],
    basePostProcessors: PostProcessorPlugin[],
    extraExtractors: ExtractorPlugin[] = [],
    extraPostProcessors: PostProcessorPlugin[] = [],
  ) {
    // Combine base and extra plugins, then sort by priority
    // in descending order (higher priority first)
    this.extractorPlugins = [...baseExtractors, ...extraExtractors].sort(
      (a, b) => b.priority - a.priority,
    )

    this.postProcessorPlugins = [...basePostProcessors, ...extraPostProcessors].sort(
      (a, b) => b.priority - a.priority,
    )
  }

  getExtractors() {
    return this.extractorPlugins
  }

  getPostProcessors() {
    return this.postProcessorPlugins
  }
}
