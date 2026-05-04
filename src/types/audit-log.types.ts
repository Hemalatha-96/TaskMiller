export interface AuditLogChange {
  field: string
  from: unknown
  to: unknown
}

export interface AuditLog {
  id: string
  orgId: string
  actorId: string
  action: string
  entityType: 'task' | 'project' | string
  entityId: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  ipAddress: string
  description: string | null
  entityName: string | null
  projectName: string | null
  changes: AuditLogChange[]
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
  from?: string
  to?: string
}
