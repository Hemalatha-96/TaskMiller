import { get, patch } from '../client'
import type { Notification } from '../../types/notification.types'

export const getNotificationsApi = (): Promise<any> =>
  get<any>('/api/notifications')

export const markOneReadApi = (id: string): Promise<Notification> =>
  patch<Notification>(`/api/notifications/${id}/read`, {})

export const markAllReadApi = (): Promise<{ message: string }> =>
  patch<{ message: string }>('/api/notifications/read-all', {})
