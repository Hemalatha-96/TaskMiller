import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KEYS } from '../../constants/queryKeys'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications.api'
import type { NotificationsListResponse } from '../../types/notification.types'

export function useNotifications() {
  return useQuery({
    queryKey: KEYS.NOTIFICATIONS,
    queryFn: listNotifications,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: KEYS.NOTIFICATIONS })
      const previous = qc.getQueryData<NotificationsListResponse>(KEYS.NOTIFICATIONS)

      if (previous) {
        const nowIso = new Date().toISOString()
        qc.setQueryData<NotificationsListResponse>(KEYS.NOTIFICATIONS, {
          ...previous,
          notifications: previous.notifications.map((n) => ({
            ...n,
            readAt: n.readAt ?? nowIso,
          })),
        })
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(KEYS.NOTIFICATIONS, context.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.NOTIFICATIONS })
    },
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onMutate: async (notificationId) => {
      await qc.cancelQueries({ queryKey: KEYS.NOTIFICATIONS })
      const previous = qc.getQueryData<NotificationsListResponse>(KEYS.NOTIFICATIONS)

      if (previous) {
        const nowIso = new Date().toISOString()
        qc.setQueryData<NotificationsListResponse>(KEYS.NOTIFICATIONS, {
          ...previous,
          notifications: previous.notifications.map((n) =>
            n.id === notificationId ? { ...n, readAt: n.readAt ?? nowIso } : n,
          ),
        })
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(KEYS.NOTIFICATIONS, context.previous)
    },
    onSuccess: (updated, notificationId) => {
      const previous = qc.getQueryData<NotificationsListResponse>(KEYS.NOTIFICATIONS)
      if (!previous) return

      qc.setQueryData<NotificationsListResponse>(KEYS.NOTIFICATIONS, {
        ...previous,
        notifications: previous.notifications.map((n) => (n.id === notificationId ? { ...n, ...updated } : n)),
      })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.NOTIFICATIONS })
    },
  })
}

