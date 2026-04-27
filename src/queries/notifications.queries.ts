import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth.store'
import { getNotificationsApi, markOneReadApi, markAllReadApi } from '../http/services/notifications.service'
import type { Notification } from '../types/notification.types'

const QUERY_KEY = ['notifications']

function extractList(data: any): Notification[] {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.notifications)) return data.notifications
  return []
}

export function useNotifications() {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn:  getNotificationsApi,
    enabled:  !!accessToken,
    refetchInterval: 60_000,
    staleTime: 60_000,
    select: extractList,
  })
}

export function useMarkOneReadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markOneReadApi(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useMarkAllReadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markAllReadApi,
    onSuccess:  () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
