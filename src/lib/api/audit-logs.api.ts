import type { PaginatedResponse, PaginationParams } from '../../types/api.types'
import type { AuditLog, AuditLogActor, AuditLogEntityType, AuditLogOrganization } from '../../types/audit-log.types'
import { apiClient } from './client'
import { getApiErrorMessage } from './error'
import { unwrapBackendResponse } from './response'

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

type ApiAuditLogActor = {
  id?: string
  name?: string | null
  email?: string | null
}

type ApiAuditLogOrganization = {
  id?: string
  name?: string | null
  slug?: string | null
}

type ApiAuditLog = {
  id?: string
  orgId?: string | null
  org_id?: string | null
  actorId?: string | null
  actor_id?: string | null
  action?: string | null
  entityType?: string | null
  entity_type?: string | null
  entityId?: string | null
  entity_id?: string | null
  before?: unknown
  after?: unknown
  ipAddress?: string | null
  ip_address?: string | null
  createdAt?: string | null
  created_at?: string | null
  actor?: ApiAuditLogActor | null
  organization?: ApiAuditLogOrganization | null
}

type AuditLogsListPayload =
  | ApiAuditLog[]
  | {
      auditLogs?: ApiAuditLog[]
      data?: ApiAuditLog[]
      items?: ApiAuditLog[]
      results?: ApiAuditLog[]
      pagination?: ApiPagination
      total?: number
      page?: number
      limit?: number
      totalPages?: number
    }

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return value
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function normalizeActor(actor: ApiAuditLogActor | null | undefined, actorId?: string): AuditLogActor | undefined {
  if (!actor && !actorId) return undefined
  return {
    id: actor?.id ?? actorId ?? 'unknown',
    name: actor?.name ?? 'Unknown',
    email: actor?.email ?? '',
  }
}

function normalizeOrganization(org: ApiAuditLogOrganization | null | undefined, orgId?: string): AuditLogOrganization | undefined {
  if (!org && !orgId) return undefined
  return {
    id: org?.id ?? orgId ?? 'unknown',
    name: org?.name ?? 'Unknown',
    slug: org?.slug ?? '',
  }
}

function normalizeAuditLog(input: ApiAuditLog, index: number): AuditLog {
  const nowIso = new Date().toISOString()
  const createdAt = input.createdAt ?? input.created_at ?? nowIso
  const orgId = input.orgId ?? input.org_id ?? input.organization?.id ?? ''
  const actorId = input.actorId ?? input.actor_id ?? input.actor?.id ?? ''
  const entityType = (input.entityType ?? input.entity_type ?? 'unknown') as AuditLogEntityType
  const entityId = input.entityId ?? input.entity_id ?? ''

  return {
    id: input.id ?? `audit_${createdAt}_${index}`,
    orgId,
    actorId,
    action: input.action ?? 'unknown',
    entityType,
    entityId,
    before: parseMaybeJson(input.before),
    after: parseMaybeJson(input.after),
    ipAddress: input.ipAddress ?? input.ip_address ?? undefined,
    createdAt,
    actor: normalizeActor(input.actor, actorId || undefined),
    organization: normalizeOrganization(input.organization, orgId || undefined),
  }
}

function coerceListPayload(payload: AuditLogsListPayload): Exclude<AuditLogsListPayload, ApiAuditLog[]> {
  if (Array.isArray(payload)) return { auditLogs: payload }
  return payload
}

function toPaginatedAuditLogs(payload: AuditLogsListPayload, params: PaginationParams): PaginatedResponse<AuditLog> {
  const obj = coerceListPayload(payload)
  const items = obj.auditLogs ?? obj.data ?? obj.items ?? obj.results ?? []
  const pagination = (obj as { pagination?: ApiPagination }).pagination

  const total = obj.total ?? pagination?.totalRecords ?? pagination?.total ?? items.length
  const page = obj.page ?? pagination?.currentPage ?? pagination?.page ?? params.page ?? 1
  const limit = obj.limit ?? pagination?.limit ?? params.limit ?? 20
  const totalPages = obj.totalPages ?? pagination?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit)))

  return { data: items.map(normalizeAuditLog), total, page, limit, totalPages }
}

export async function getAuditLogs(params: PaginationParams = {}): Promise<PaginatedResponse<AuditLog>> {
  try {
    const res = await apiClient.get('/api/audit-logs', {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search,
        orgId: params.orgId,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    })

    const data = unwrapBackendResponse<AuditLogsListPayload>(res.data)
    return toPaginatedAuditLogs(data, params)
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}

