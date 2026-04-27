import { Store } from '@tanstack/store'
import { useStore } from '@tanstack/react-store'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'superadmin' | 'admin' | 'developer'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  orgId?: string
  orgName?: string
  avatarUrl?: string | null
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
}

// ─── Initial state (read from localStorage on app start) ─────────────────────

const isBrowser = typeof window !== 'undefined'
const stored = isBrowser ? localStorage.getItem('auth') : null
const initial: AuthState = stored
  ? JSON.parse(stored)
  : { user: null, accessToken: null, refreshToken: null }

// ─── Store ────────────────────────────────────────────────────────────────────

export const authStore = new Store<AuthState>(initial)

// Persist to localStorage whenever state changes (browser only)
authStore.subscribe(() => {
  if (isBrowser) localStorage.setItem('auth', JSON.stringify(authStore.state))
})

// ─── Actions ──────────────────────────────────────────────────────────────────

export function setAuth(user: AuthUser, accessToken: string, refreshToken: string) {
  authStore.setState(() => ({ user, accessToken, refreshToken }))
}

export function clearAuth() {
  if (isBrowser) localStorage.removeItem('auth')
  authStore.setState(() => ({ user: null, accessToken: null, refreshToken: null }))
}

// ─── React hook ───────────────────────────────────────────────────────────────

export function useAuthStore() {
  return useStore(authStore, (state) => state)
}
