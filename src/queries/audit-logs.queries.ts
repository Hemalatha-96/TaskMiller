import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth.store'
import { getAuditLogsApi } from '../http/services/audit-logs.service'
import type { AuditLogParams } from '../types/audit-log.types'

export function useAuditLogs(params: AuditLogParams = {}) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn:  () => getAuditLogsApi(params),
    enabled:  !!accessToken,
    staleTime: 30_000,
  })
}
