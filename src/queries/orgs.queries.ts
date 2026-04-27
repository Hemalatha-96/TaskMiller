import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOrgsApi, getOrgApi, createOrgApi,
  assignAdminApi, addDeveloperApi, removeMemberApi, deleteOrgApi,
} from '../http/services/orgs.service'
import { getUsersApi } from '../http/services/users.service'
import { authStore } from '../store/auth.store'
import type { OrgsParams } from '../types/org.types'

// ─── GET /api/orgs ────────────────────────────────────────────────────────────

export function useOrgs(params: OrgsParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey:        ['orgs', params],
    queryFn:         () => getOrgsApi(params),
    placeholderData: (prev) => prev,
    enabled:         !!authStore.state.accessToken && options?.enabled !== false,
  })
}

// ─── GET /api/orgs/:id ────────────────────────────────────────────────────────

export function useOrg(id: string) {
  return useQuery({
    queryKey: ['orgs', id],
    queryFn:  () => getOrgApi(id),
    enabled:  !!id && !!authStore.state.accessToken,
  })
}

// ─── POST /api/orgs ───────────────────────────────────────────────────────────

export function useCreateOrgMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createOrgApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] })
    },
  })
}

// ─── GET /api/users?unassigned=true&role=admin|developer ─────────────────────

export function useUnassignedUsers(role: 'admin' | 'developer') {
  return useQuery({
    queryKey: ['users', 'unassigned', role],
    queryFn:  () => getUsersApi({ unassigned: true, role }),
    enabled:  !!authStore.state.accessToken,
  })
}

// ─── POST /api/orgs/:id/admin ─────────────────────────────────────────────────

export function useAssignAdminMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: string }) =>
      assignAdminApi(orgId, userId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: ['orgs', orgId] })
      queryClient.invalidateQueries({ queryKey: ['users', 'unassigned'] })
    },
  })
}

// ─── POST /api/orgs/:id/developers ───────────────────────────────────────────

export function useAddDeveloperMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: string }) =>
      addDeveloperApi(orgId, userId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: ['orgs', orgId] })
      queryClient.invalidateQueries({ queryKey: ['users', 'unassigned'] })
    },
  })
}

// ─── DELETE /api/orgs/:id/members/:userId ────────────────────────────────────

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: string }) =>
      removeMemberApi(orgId, userId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: ['orgs', orgId] })
      queryClient.invalidateQueries({ queryKey: ['users', 'unassigned'] })
    },
  })
}

// ─── DELETE /api/orgs/:id ─────────────────────────────────────────────────────

export function useDeleteOrgMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orgId: string) => deleteOrgApi(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgs'] })
    },
  })
}
