const ACCESS_TOKEN_KEY = 'tm_access_token'
const REFRESH_TOKEN_KEY = 'tm_refresh_token'

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function saveTokens(accessToken: string, refreshToken: string) {
  if (!canUseLocalStorage()) return
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function getAccessToken(): string | null {
  if (!canUseLocalStorage()) return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (!canUseLocalStorage()) return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function clearTokens() {
  if (!canUseLocalStorage()) return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}
