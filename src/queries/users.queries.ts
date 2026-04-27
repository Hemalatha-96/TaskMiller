import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUsersApi, getMeApi, getUserApi,
  createUserApi, updateMeApi, toggleUserStatusApi,
} from '../http/services/users.service'
import { authStore } from '../store/auth.store'
import type { UsersParams, CreateUserBody, UpdateMeBody } from '../types/user.types'

// ─── GET /api/users ───────────────────────────────────────────────────────────

export function useUsers(params: UsersParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey:        ['users', params],
    queryFn:         () => getUsersApi(params),
    placeholderData: (prev) => prev,
    enabled:         (options?.enabled ?? true) && !!authStore.state.accessToken,
  })
}

// ─── GET /api/users/me ────────────────────────────────────────────────────────

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn:  getMeApi,
    enabled:  !!authStore.state.accessToken,
  })
}

// ─── GET /api/users/:id ───────────────────────────────────────────────────────

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn:  () => getUserApi(id),
    enabled:  !!id && !!authStore.state.accessToken,
  })
}

// ─── POST /api/users ──────────────────────────────────────────────────────────

export function useCreateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateUserBody) => createUserApi(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// ─── PATCH /api/users/me ──────────────────────────────────────────────────────

export function useUpdateMeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateMeBody) => updateMeApi(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// ─── PATCH /api/users/:id/status ─────────────────────────────────────────────

export function useToggleUserStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      toggleUserStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
