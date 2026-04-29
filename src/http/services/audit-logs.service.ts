import { get } from '../client'
import type { AuditLog, AuditLogListResponse, AuditLogParams } from '../../types/audit-log.types'

export const getAuditLogsApi = (params: AuditLogParams = {}): Promise<AuditLogListResponse> => {
  const qs = new URLSearchParams()
  if (params.id)         qs.set('id',         params.id)
  if (params.page)       qs.set('page',       String(params.page))
  if (params.limit)      qs.set('limit',      String(params.limit))
  if (params.orgId)      qs.set('orgId',      params.orgId)
  if (params.entityType) qs.set('entityType', params.entityType)
  if (params.entityId)   qs.set('entityId',   params.entityId)
  if (params.dateFrom)   qs.set('dateFrom',   params.dateFrom)
  if (params.dateTo)     qs.set('dateTo',     params.dateTo)
  return get<AuditLogListResponse>(`/api/audit-logs?${qs}`)
}

export const getAuditLogByIdApi = (id: string): Promise<AuditLog | null> =>
  get<AuditLogListResponse>(`/api/audit-logs?id=${encodeURIComponent(id)}`)
    .then((res) => res.auditLogs[0] ?? null)
