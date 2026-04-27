import { useAuthStore, clearAuth } from '../store/auth.store'

// ─── useAuth ──────────────────────────────────────────────────────────────────
// Single hook used across every component that needs role/user info.
// Add more helpers here as role features are defined.

export function useAuth() {
  const { user, accessToken } = useAuthStore()

  return {
    user,
    isLoggedIn:    !!accessToken,
    role:          user?.role ?? null,

    // Role checks — use these in components to show/hide UI
    isSuperAdmin:  user?.role === 'superadmin',
    isAdmin:       user?.role === 'admin' || user?.role === 'superadmin',
    isDeveloper:   user?.role === 'developer',

    // Org context
    orgId:         user?.orgId ?? null,
    orgName:       user?.orgName ?? null,

    // Logout helper
    logout: clearAuth,
  }
}
