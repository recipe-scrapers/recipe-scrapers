export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

export function isNull<T>(value: T | null): value is null {
  return value === null
}

// oxlint-disable-next-line typescript/no-unsafe-function-type -- Accept any callable.
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
  )
}

export const isObjectLike = (value: unknown): value is Record<PropertyKey, unknown> => {
  return typeof value === 'object' && value !== null
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Extracts the host name from a URL string
 * and removes a leading 'www.' prefix if present.
 * Throws an error if the input is not a valid URL.
 */
export function getHostName(value: string) {
  try {
    const { hostname } = new URL(value)
    return hostname.startsWith('www.') ? hostname.slice(4) : hostname
  } catch {
    throw new Error(`Invalid URL: ${value}`)
  }
}

/**
 * Resolves an error message from various error types.
 */
export function resolveErrorMessage(error: unknown, defaultMessage = 'Unknown error'): string {
  if (error instanceof Error) {
    return error.message
  }

  if (isObjectLike(error) && 'message' in error && isString(error.message)) {
    return error.message
  }

  if (isString(error)) {
    return error
  }

  return defaultMessage
}
