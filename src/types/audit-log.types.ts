export type AuditLogEntityType = 'task' | 'project' | 'organization' | 'org' | 'user' | (string & {})

export interface AuditLogActor {
  id: string
  name: string
  email: string
}

export interface AuditLogOrganization {
  id: string
  name: string
  slug: string
}

export interface AuditLog {
  id: string
  orgId: string
  actorId: string
  action: string
  entityType: AuditLogEntityType
  entityId: string
  before: unknown
  after: unknown
  ipAddress?: string
  createdAt: string
  actor?: AuditLogActor
  organization?: AuditLogOrganization
}

