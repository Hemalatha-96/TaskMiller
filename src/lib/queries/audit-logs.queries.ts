import { useQuery } from '@tanstack/react-query'
import type { PaginationParams } from '../../types/api.types'
import { KEYS } from '../../constants/queryKeys'
import { getAuditLogs } from '../api/audit-logs.api'

export function useAuditLogs(params: PaginationParams = {}) {
  return useQuery({
    queryKey: [...KEYS.AUDIT_LOGS, params],
    queryFn: () => getAuditLogs(params),
  })
}

