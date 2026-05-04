import { get } from '../client'
import type { AuditLog, AuditLogListResponse, AuditLogParams } from '../../types/audit-log.types'

export const getAuditLogApi = async (id: string): Promise<AuditLog> => {
  const res = await get<AuditLogListResponse>(`/api/audit-logs?id=${id}`)
  return res.auditLogs[0]
}

export const getAuditLogsApi = (params: AuditLogParams = {}): Promise<AuditLogListResponse> => {
  const qs = new URLSearchParams()
  if (params.page)       qs.set('page',       String(params.page))
  if (params.limit)      qs.set('limit',      String(params.limit))
  if (params.orgId)      qs.set('orgId',      params.orgId)
  if (params.entityType) qs.set('entityType', params.entityType)
  if (params.entityId)   qs.set('entityId',   params.entityId)
  if (params.from)       qs.set('from',       params.from)
  if (params.to)         qs.set('to',         params.to)
  return get<AuditLogListResponse>(`/api/audit-logs?${qs}`)
}
