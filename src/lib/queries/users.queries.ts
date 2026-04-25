import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { getUsers, getUserById, getMe, updateMe, updateUserStatus, createUser, deleteUser } from '../api/users.api'
import { KEYS } from '../../constants/queryKeys'
import type { PaginationParams } from '../../types/api.types'

export function useUsers(params: PaginationParams = {}) {
  return useQuery({ queryKey: [...KEYS.USERS, params], queryFn: () => getUsers(params) })
}

export function useUser(id: string) {
  return useQuery({ queryKey: KEYS.USER(id), queryFn: () => getUserById(id), enabled: !!id })
}

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: getMe })
}

export function useUpdateMe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateMe,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

export function useToggleUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateUserStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.USERS }),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.USERS }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.USERS }),
  })
}
