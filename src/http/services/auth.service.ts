import { post } from '../client'
import { authStore } from '../../store/auth.store'
import type { UserRole, AuthUser } from '../../store/auth.store'

// ─── Response Types ────────────────────────────────────────────────────────────

interface RawAuthData {
  user: { id: string; name: string; email: string; role: UserRole; orgId?: string; orgName?: string }
  tokens: { accessToken: string; refreshToken: string }
}

export interface AuthResult {
  user: AuthUser
  tokens: { accessToken: string; refreshToken: string }
}

export interface OtpRequestResult {
  message: string
}

// ─── JWT helper ───────────────────────────────────────────────────────────────
//
// Backend puts orgId inside the JWT payload.
// Decode base64 payload client-side to extract it — no library needed.

function extractOrgId(token: string): string | undefined {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.orgId ?? undefined
  } catch {
    return undefined
  }
}

function enrichUser(raw: RawAuthData['user'], token: string): AuthUser {
  return { ...raw, orgId: raw.orgId ?? extractOrgId(token) }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export async function loginApi(email: string, password: string): Promise<AuthResult> {
  const data = await post<RawAuthData>('/api/auth/login', { email, password })
  return { user: enrichUser(data.user, data.tokens.accessToken), tokens: data.tokens }
}

// ─── POST /api/auth/request-otp ──────────────────────────────────────────────

export function requestOtpApi(email: string): Promise<OtpRequestResult> {
  return post<OtpRequestResult>('/api/auth/request-otp', { email })
}

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────────

export async function verifyOtpApi(email: string, otp: string): Promise<AuthResult> {
  const data = await post<RawAuthData>('/api/auth/verify-otp', { email, otp })
  return { user: enrichUser(data.user, data.tokens.accessToken), tokens: data.tokens }
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

export function logoutApi(): Promise<void> {
  const refreshToken = authStore.state.refreshToken
  if (!refreshToken) return Promise.resolve()
  return post('/api/auth/logout', { refreshToken })
}
