import { get } from '../client'
import type { AuditLogListResponse, AuditLogParams } from '../../types/audit-log.types'

export const getAuditLogsApi = (params: AuditLogParams = {}): Promise<AuditLogListResponse> => {
  const qs = new URLSearchParams()
  if (params.page)       qs.set('page',       String(params.page))
  if (params.limit)      qs.set('limit',      String(params.limit))
  if (params.orgId)      qs.set('orgId',      params.orgId)
  if (params.entityType) qs.set('entityType', params.entityType)
  if (params.entityId)   qs.set('entityId',   params.entityId)
  return get<AuditLogListResponse>(`/api/audit-logs?${qs}`)
}
