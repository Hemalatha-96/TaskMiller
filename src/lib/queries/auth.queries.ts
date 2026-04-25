import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, register, logout, requestOtp, verifyOtp } from '../api/auth.api'
import { useAuthStore } from '../../store/auth.store'
import { useOrgStore } from '../../store/org.store'
import type { LoginPayload, RegisterPayload } from '../../types/auth.types'

function applyOrgScope(user: any) {
  const { setActiveOrg } = useOrgStore.getState()
  if (user?.role === 'superadmin') {
    setActiveOrg(null, null)
  } else {
    // admin, manager, developer — scope to their org; clears any stale superadmin scope
    setActiveOrg(user?.orgId ?? null, null)
  }
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (data) => {
      qc.clear()
      setAuth(data.user as any, data.accessToken, data.refreshToken)
      applyOrgScope(data.user)
    },
  })
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: (data) => {
      setAuth(data.user as any, data.accessToken, data.refreshToken)
    },
  })
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      qc.clear()
      clearAuth()
      useOrgStore.getState().setActiveOrg(null, null)
    },
  })
}

export function useRequestOtp() {
  return useMutation({ mutationFn: (email: string) => requestOtp(email) })
}

export function useVerifyOtp() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) => verifyOtp(email, otp),
    onSuccess: (data) => {
      qc.clear()
      setAuth(data.user as any, data.accessToken, data.refreshToken)
      applyOrgScope(data.user)
    },
  })
}
