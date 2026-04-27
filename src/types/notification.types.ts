export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  entityType: 'task' | string
  entityId: string
  readAt: string | null
  createdAt: string
}
