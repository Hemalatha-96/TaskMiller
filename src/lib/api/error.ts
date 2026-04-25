import axios from 'axios'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function firstString(values: unknown[]): string | undefined {
  for (const value of values) {
    const s = asNonEmptyString(value)
    if (s) return s
  }
  return undefined
}

function firstMessageFromArray(values: unknown[]): string | undefined {
  for (const value of values) {
    const s = asNonEmptyString(value)
    if (s) return s
    if (isRecord(value)) {
      const direct = firstString([value.message, value.error, value.detail])
      if (direct) return direct
    }
  }
  return undefined
}

function firstMessageFromRecordValues(record: UnknownRecord): string | undefined {
  for (const value of Object.values(record)) {
    const s = asNonEmptyString(value)
    if (s) return s
    if (Array.isArray(value)) {
      const fromArray = firstMessageFromArray(value)
      if (fromArray) return fromArray
    }
  }
  return undefined
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data

    if (typeof data === 'string' && data.trim()) return data.trim()

    if (Array.isArray(data)) {
      const fromArray = firstMessageFromArray(data)
      if (fromArray) return fromArray
    }

    if (isRecord(data)) {
      const directMessage = firstString([data.message, data.error, data.detail])
      if (directMessage) return directMessage

      if (Array.isArray(data.message)) {
        const fromMessageArray = firstMessageFromArray(data.message)
        if (fromMessageArray) return fromMessageArray
      }

      if (isRecord(data.error)) {
        const nestedErrorMessage = firstString([data.error.message, data.error.error, data.error.detail])
        if (nestedErrorMessage) return nestedErrorMessage
      }

      if (Array.isArray(data.issues)) {
        const fromIssues = firstMessageFromArray(data.issues)
        if (fromIssues) return fromIssues
      }

      // Common API shapes:
      // { success:false, message:"..." }
      // { errors:[{ message:"..." }] }
      if (isRecord(data.errors)) {
        const fromErrorMap = firstMessageFromRecordValues(data.errors)
        if (fromErrorMap) return fromErrorMap
      }

      if (Array.isArray(data.errors)) {
        const firstError = data.errors[0]
        if (typeof firstError === 'string' && firstError.trim()) return firstError
        if (isRecord(firstError)) {
          const errorMessage = firstString([firstError.message, firstError.error])
          if (errorMessage) return errorMessage
        }
      }
    }

    if (!error.response) return 'Network error. Please check your connection and try again.'
    return error.message || 'Request failed.'
  }

  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Something went wrong. Please try again.'
}
