import type { LoginPayload, RegisterPayload, TokenResponse } from '../../types/auth.types'
import { clearTokens, getRefreshToken, saveTokens } from '../../utils/token'
import { apiClient } from './client'
import { unwrapBackendResponse } from './response'

function extractOrgIdFromToken(token: string): string | undefined {
  try {
    const payload = token.split('.')[1]
    if (!payload) return undefined
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof decoded?.orgId === 'string' ? decoded.orgId : undefined
  } catch {
    return undefined
  }
}

type AuthTokens = {
  accessToken: string
  refreshToken: string
}

type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  orgId?: string | null
  avatarUrl?: string | null
}

type LoginResponseData = {
  user: AuthUser
  tokens: AuthTokens
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const res = await apiClient.post('/api/auth/login', payload)
  const data = unwrapBackendResponse<LoginResponseData>(res.data)

  saveTokens(data.tokens.accessToken, data.tokens.refreshToken)
  const orgIdFromToken = extractOrgIdFromToken(data.tokens.accessToken)
  return {
    accessToken: data.tokens.accessToken,
    refreshToken: data.tokens.refreshToken,
    user: {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      orgId: data.user.orgId ?? orgIdFromToken ?? undefined,
      avatar: data.user.avatarUrl ?? undefined,
    },
  }
}

export async function register(_payload: RegisterPayload): Promise<TokenResponse> {
  throw new Error('Self-registration is not supported. Please use OTP login or contact your administrator.')
}

export async function refreshTokens(refreshToken?: string): Promise<AuthTokens> {
  const rt = refreshToken ?? getRefreshToken()
  if (!rt) throw new Error('No refresh token found')
  const res = await apiClient.post('/api/auth/refresh', { refreshToken: rt })
  const data = unwrapBackendResponse<{ tokens: AuthTokens }>(res.data)

  saveTokens(data.tokens.accessToken, data.tokens.refreshToken)
  return data.tokens
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken()
  try {
    if (refreshToken) {
      await apiClient.post('/api/auth/logout', { refreshToken })
    }
  } catch {
    // Ignore logout errors; always clear local tokens.
  } finally {
    clearTokens()
  }
}

export async function requestOtp(email: string): Promise<{ message: string }> {
  const res = await apiClient.post('/api/auth/request-otp', { email })
  const data = unwrapBackendResponse<{ message: string }>(res.data)
  return { message: data.message }
}

export async function verifyOtp(email: string, otp: string): Promise<TokenResponse> {
  const res = await apiClient.post('/api/auth/verify-otp', { email, otp })
  const data = unwrapBackendResponse<LoginResponseData>(res.data)

  saveTokens(data.tokens.accessToken, data.tokens.refreshToken)
  const orgIdFromToken = extractOrgIdFromToken(data.tokens.accessToken)
  return {
    accessToken: data.tokens.accessToken,
    refreshToken: data.tokens.refreshToken,
    user: {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      orgId: data.user.orgId ?? orgIdFromToken ?? undefined,
      avatar: data.user.avatarUrl ?? undefined,
    },
  }
}
