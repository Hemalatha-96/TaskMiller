export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError extends Error {
  statusCode?: number
  errors?: { field: string; message: string }[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
