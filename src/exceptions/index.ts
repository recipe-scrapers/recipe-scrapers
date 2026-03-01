import type { ValidationIssue } from '@/schema-adapter'
import { isDefined, resolveErrorMessage } from '@/utils'

export class ExtractorNotFoundException extends Error {
  constructor(public readonly field: string) {
    super(`No extractor found for field: ${field}`)
    this.name = 'ExtractorNotFoundException'
  }
}

export class NotImplementedException extends Error {
  constructor(method: string) {
    super(`Method should be implemented: ${method}`)
    this.name = 'NotImplementedException'
  }
}

export class UnsupportedFieldException extends Error {
  constructor(field: string) {
    super(`Extraction not supported for field: ${field}`)
    this.name = 'UnsupportedFieldException'
  }
}

export class ExtractionFailedException extends Error {
  constructor(
    public readonly field: string,
    public readonly value?: unknown,
  ) {
    const msg = isDefined(value)
      ? `Invalid value for "${field}": ${String(value)}`
      : `No value found for "${field}"`

    super(msg)
    this.name = 'ExtractionFailedException'
  }
}

export class ExtractionRuntimeException extends Error {
  constructor(
    public readonly field: string,
    public readonly source: string,
    public readonly extractionCause?: unknown,
  ) {
    const causeMessage = resolveErrorMessage(
      extractionCause,
      'Unknown extraction error',
    )

    super(
      `Unexpected extraction error for field "${field}" from ${source}: ${causeMessage}`,
    )
    this.name = 'ExtractionRuntimeException'
  }
}

export class NoIngredientsFoundException extends ExtractionFailedException {
  constructor() {
    super('ingredients')
    this.name = 'NoIngredientsFoundException'
  }
}

export class ValidationException extends Error {
  constructor(
    public readonly issues: readonly ValidationIssue[],
    public readonly validationCause?: unknown,
  ) {
    super('Recipe validation failed')
    this.name = 'ValidationException'
  }
}
