export interface AuditLogChange {
  field: string
  from: string
  to: string
}

export interface AuditLog {
  id: string
  orgId: string
  actorId: string
  action: string
  entityType: 'task' | 'project' | string
  entityId: string
  before: string | Record<string, unknown> | null
  after: string | Record<string, unknown> | null
  ipAddress: string
  createdAt: string
  entityName?: string
  projectName?: string
  parentTaskName?: string
  changes?: AuditLogChange[]
  description?: string
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
  id?:        string
  page?:      number
  limit?:     number
  entityType?: string
  entityId?:  string
  orgId?:     string
  dateFrom?:  string
  dateTo?:    string
}
