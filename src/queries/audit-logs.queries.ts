import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth.store'
import { getAuditLogsApi, getAuditLogByIdApi } from '../http/services/audit-logs.service'
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

export function useAuditLogById(id: string | null) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey:  ['audit-log', id],
    queryFn:   () => getAuditLogByIdApi(id!),
    enabled:   !!accessToken && !!id,
    staleTime: 0,
    gcTime:    0,
  })
}
