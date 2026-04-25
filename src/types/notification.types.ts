export type NotificationType =
  | 'task_assigned'
  | 'task_due_soon'
  | 'task_overdue'
  | 'task_completed'
  | 'comment_added'
  | 'comment_mentioned'
  | 'comment_replied'
  | 'member_added'
  | 'member_removed'
  | 'project_assigned'
  | (string & {})

export type NotificationEntityType =
  | 'task'
  | 'project'
  | 'organization'
  | 'org'
  | 'user'
  | (string & {})

export interface Notification {
  id: string
  userId?: string
  type: NotificationType
  title: string
  body?: string
  entityType?: NotificationEntityType
  entityId?: string
  readAt?: string | null
  createdAt: string
}

export interface NotificationsPagination {
  currentPage: number
  limit: number
  totalRecords: number
  totalPages: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
}

export interface NotificationsListResponse {
  notifications: Notification[]
  pagination: NotificationsPagination
}

