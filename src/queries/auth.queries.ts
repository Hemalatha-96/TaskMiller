// Auth queries — TanStack Query mutation hooks
// Following the pattern: query files export useMutation hooks,
// components import from here — never directly from http/services/.

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { loginApi, requestOtpApi, verifyOtpApi, logoutApi } from '../http/services/auth.service'
import { setAuth, clearAuth } from '../store/auth.store'
import { setSelectedOrg } from '../store/orgContext.store'
import { router } from '../router'

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export function useLoginMutation() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginApi(email, password),
    onSuccess: (result) => {
      setAuth(result.user, result.tokens.accessToken, result.tokens.refreshToken)
    },
  })
}

// ─── POST /api/auth/request-otp ──────────────────────────────────────────────

export function useRequestOtpMutation() {
  return useMutation({
    mutationFn: (email: string) => requestOtpApi(email),
  })
}

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────────

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      verifyOtpApi(email, otp),
    onSuccess: (result) => {
      setAuth(result.user, result.tokens.accessToken, result.tokens.refreshToken)
    },
  })
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      clearAuth()
      setSelectedOrg(null)
      queryClient.cancelQueries()
      router.navigate({ to: '/login' }).finally(() => {
        queryClient.removeQueries()
      })
    },
  })
}
