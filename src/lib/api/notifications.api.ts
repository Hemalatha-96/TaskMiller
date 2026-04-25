import { apiClient } from './client'
import { getApiErrorMessage } from './error'
import { unwrapBackendResponse } from './response'
import type { Notification, NotificationType, NotificationsListResponse, NotificationsPagination } from '../../types/notification.types'

type ApiPagination = {
  currentPage?: number
  page?: number
  limit?: number
  totalRecords?: number
  total?: number
  totalPages?: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
}

type ApiNotification = {
  id?: string
  userId?: string
  user_id?: string
  type?: string
  title?: string | null
  body?: string | null
  message?: string | null
  entityType?: string | null
  entity_type?: string | null
  entityId?: string | null
  entity_id?: string | null
  readAt?: string | null
  read_at?: string | null
  createdAt?: string | null
  created_at?: string | null
}

type NotificationsListPayload =
  | ApiNotification[]
  | {
      notifications?: ApiNotification[]
      data?: ApiNotification[]
      items?: ApiNotification[]
      results?: ApiNotification[]
      pagination?: ApiPagination
    }

function normalizeNotification(input: ApiNotification, index: number): Notification {
  const nowIso = new Date().toISOString()
  const createdAt = input.createdAt ?? input.created_at ?? nowIso
  const id = input.id ?? `notification_${createdAt}_${index}`
  const title = (input.title ?? '').trim() || 'Notification'
  const type = ((input.type ?? 'unknown').trim() || 'unknown') as NotificationType

  return {
    id,
    userId: input.userId ?? input.user_id ?? undefined,
    type,
    title,
    body: (input.body ?? input.message ?? undefined) ?? undefined,
    entityType: (input.entityType ?? input.entity_type ?? undefined) ?? undefined,
    entityId: (input.entityId ?? input.entity_id ?? undefined) ?? undefined,
    readAt: input.readAt ?? input.read_at ?? null,
    createdAt,
  }
}

function toPagination(pagination: ApiPagination | undefined, listLength: number): NotificationsPagination {
  const totalRecords = pagination?.totalRecords ?? pagination?.total ?? listLength
  const currentPage = pagination?.currentPage ?? pagination?.page ?? 1
  const limit = pagination?.limit ?? (listLength || 20)
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(totalRecords / Math.max(1, limit)))

  return {
    currentPage,
    limit,
    totalRecords,
    totalPages,
    hasNextPage: pagination?.hasNextPage,
    hasPrevPage: pagination?.hasPrevPage,
  }
}

export async function listNotifications(): Promise<NotificationsListResponse> {
  try {
    const res = await apiClient.get('/api/notifications')
    const data = unwrapBackendResponse<NotificationsListPayload>(res.data)

    const obj = Array.isArray(data) ? { notifications: data } : data
    const list = obj.notifications ?? obj.data ?? obj.items ?? obj.results ?? []

    return {
      notifications: list.map(normalizeNotification),
      pagination: toPagination(obj.pagination, list.length),
    }
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  try {
    const res = await apiClient.patch('/api/notifications/read-all')
    const data = unwrapBackendResponse<any>(res.data)
    const message = (typeof data?.message === 'string' && data.message.trim() ? data.message.trim() : undefined) ?? 'All notifications marked as read'
    return { message }
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  try {
    const res = await apiClient.patch(`/api/notifications/${notificationId}/read`)
    const data = unwrapBackendResponse<any>(res.data)
    const notification = (data?.notification ?? data?.data ?? data) as ApiNotification
    return normalizeNotification(notification, 0)
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}
