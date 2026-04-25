import { useAuthStore } from '../store/auth.store'

export function useAuth() {
  const { user, accessToken, isAuthenticated, clearAuth } = useAuthStore()

  return {
    user,
    accessToken,
    isAuthenticated,
    role: user?.role ?? null,
    orgId: user?.orgId ?? null,
    logout: clearAuth,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isSuperAdmin: user?.role === 'superadmin',
    isManager: user?.role === 'manager',
    isDeveloper: user?.role === 'developer',
  }
}
