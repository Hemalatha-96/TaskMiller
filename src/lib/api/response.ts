export type BackendSuccessResponse<T> = {
  success: true
  data: T
}

export type BackendErrorResponse = {
  success: false
  message?: string
}

export type BackendResponse<T> = BackendSuccessResponse<T> | BackendErrorResponse

export function unwrapBackendResponse<T>(res: BackendResponse<T>): T {
  if (res && typeof res === 'object' && 'success' in res) {
    if (res.success) return res.data
    throw new Error(res.message || 'Request failed')
  }
  // Fallback for non-standard responses
  return res as unknown as T
}

