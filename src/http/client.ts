import { authStore, clearAuth, setAuth } from '../store/auth.store'
import { router } from '../router'
import type { ApiError } from '../types/api.types'

export const BASE_URL = import.meta.env.VITE_API_URL

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
//
// All backend responses are wrapped: { success: true, data: <payload> }
// All backend errors are:            { success: false, statusCode, message }
//
// This function unwraps `.data` on success and throws the error body on failure.

const TIMEOUT_MS = 15_000

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = authStore.state.accessToken

  let res: Response
  try {
    res = await fetchWithTimeout(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw Object.assign(new Error('Request timed out. Please try again.'), { statusCode: 408 }) as ApiError
    }
    throw err
  }

  // Try silent token refresh on 401 — only when a session exists
  if (res.status === 401 && token) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      // Retry original request with new token
      const newToken = authStore.state.accessToken
      const retry = await fetchWithTimeout(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...(options.headers ?? {}),
        },
      })
      if (!retry.ok) {
        const errBody = await retry.json()
        throw Object.assign(new Error(errBody.message ?? 'Request failed'), errBody) as ApiError
      }
      const retryBody = await retry.json()
      return retryBody.data as T
    }

    // Refresh also failed — log out and redirect
    clearAuth()
    router.navigate({ to: '/login' })
    throw new Error('Session expired')
  }

  // Throw the full error body so UI can read .message / .errors
  if (!res.ok) {
    const body = await res.json()
    throw Object.assign(new Error(body.message ?? 'Request failed'), body) as ApiError
  }

  // Unwrap { success: true, data: <payload> }
  const body = await res.json()
  return body.data as T
}

// ─── Convenience methods ──────────────────────────────────────────────────────

export const get   = <T>(path: string) => request<T>(path, { method: 'GET' })
export const post  = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) })
export const patch = <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
export const del   = <T>(path: string) => request<T>(path, { method: 'DELETE' })

// ─── Silent refresh ───────────────────────────────────────────────────────────
//
// A single shared promise is reused for the duration of any in-flight refresh.
// Without this, concurrent 401s each call the refresh endpoint independently —
// if the backend rotates refresh tokens (single-use), only the first succeeds
// and the rest invalidate the session, causing an unexpected logout.

let refreshPromise: Promise<boolean> | null = null

function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = doRefresh().finally(() => { refreshPromise = null })
  return refreshPromise
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = authStore.state.refreshToken
  if (!refreshToken) return false

  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false

    const body = await res.json()
    const { tokens } = body.data
    const user = authStore.state.user
    if (!user) return false
    setAuth(user, tokens.accessToken, tokens.refreshToken)
    return true
  } catch {
    return false
  }
}
