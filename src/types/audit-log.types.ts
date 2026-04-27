export interface AuditLog {
  id: string
  orgId: string
  actorId: string
  action: string
  entityType: 'task' | 'project' | string
  entityId: string
  before: string | null
  after: string | null
  ipAddress: string
  createdAt: string
  actor: {
    id: string
    name: string
    email: string
  }
  organization: {
    id: string
    name: string
    slug: string
  }
}

export interface AuditLogListResponse {
  auditLogs: AuditLog[]
  pagination: {
    currentPage: number
    limit: number
    totalRecords: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface AuditLogParams {
  page?: number
  limit?: number
  entityType?: string
  entityId?: string
  orgId?: string
}
