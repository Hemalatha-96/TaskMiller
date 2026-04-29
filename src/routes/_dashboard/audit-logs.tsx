import { createFileRoute, redirect } from '@tanstack/react-router'
import { ChevronDown, Search } from 'lucide-react'
import { authStore } from '../../store/auth.store'
import { useAuditLogs } from '../../queries/audit-logs.queries'
import { useAuth } from '../../hooks/useAuth'
import { useOrgContext } from '../../store/orgContext.store'
import AuditLogTable from '../../components/audit-logs/AuditLogTable'
import Pagination from '../../components/ui/Pagination'
import DateRangePicker from '../../components/ui/DateRangePicker'
import { TableSkeleton } from '../../components/ui/Skeleton'
import ErrorMessage from '../../components/common/ErrorMessage'
import type { ApiError } from '../../types/api.types'

export const Route = createFileRoute('/_dashboard/audit-logs')({
  beforeLoad: () => {
    const role = authStore.state.user?.role
    if (role === 'developer') throw redirect({ to: '/dashboard', search: {} as any })
  },
  validateSearch: (search: Record<string, unknown>) => ({
    entityType: (search.entityType as string) || undefined,
    entityId:   (search.entityId   as string) || undefined,
    dateFrom:   (search.dateFrom   as string) || undefined,
    dateTo:     (search.dateTo     as string) || undefined,
    viewId:     (search.viewId     as string) || undefined,
    page:       Number(search.page)  > 1  ? Number(search.page)  : undefined,
    limit:      Number(search.limit) > 0 && Number(search.limit) !== 20 ? Number(search.limit) : undefined,
  }),
  component: AuditLogsPage,
})

function AuditLogsPage() {
  const { isAdmin, isSuperAdmin } = useAuth()
  const { selectedOrg } = useOrgContext()

  const orgId = isSuperAdmin && selectedOrg ? selectedOrg.id : undefined

  const navigate = Route.useNavigate()
  const { entityType = '', entityId = '', dateFrom, dateTo, viewId, page = 1, limit = 20 } = Route.useSearch()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setParams = (params: Record<string, any>) =>
    navigate({ search: (prev) => ({ ...prev, ...params }) as any })

  const { data, isLoading, isFetching, isError, error } = useAuditLogs({
    orgId,
    entityType: entityType || undefined,
    entityId:   entityId   || undefined,
    dateFrom,
    dateTo,
    page,
    limit,
  })

  const logs       = data?.auditLogs   ?? []
  const pagination = data?.pagination

  const totalRecords = pagination?.totalRecords ?? 0
  const totalPages   = pagination?.totalPages   ?? 1
  const activePage   = pagination?.currentPage  ?? page
  const activeLimit  = pagination?.limit        ?? limit
  const startEntry   = totalRecords === 0 ? 0 : (activePage - 1) * activeLimit + 1
  const endEntry     = Math.min(activePage * activeLimit, totalRecords)

  if (!isAdmin) return null

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Table card */}
      <div className="flex flex-col flex-1 overflow-hidden bg-white rounded-xl border border-gray-100">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Audit Logs
            <span className="text-gray-400 font-normal ml-1.5">({totalRecords})</span>
          </h2>

          <div className="flex items-center gap-2 flex-wrap">

            {/* Entity type filter */}
            <div className="relative">
              <select
                value={entityType}
                onChange={(e) => setParams({ entityType: e.target.value || undefined, entityId: undefined, page: undefined })}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-gray-500 bg-gray-50 outline-none cursor-pointer"
              >
                <option value="">All Entities</option>
                <option value="task">Tasks</option>
                <option value="project">Projects</option>
                <option value="user">Users</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Entity ID filter — visible only when a type is selected */}
            {entityType && (
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50">
                <Search size={14} className={isFetching ? 'text-orange-400 animate-pulse' : 'text-gray-400'} />
                <input
                  value={entityId}
                  onChange={(e) => setParams({ entityId: e.target.value || undefined, page: undefined })}
                  placeholder={`${entityType === 'task' ? 'Task' : entityType === 'project' ? 'Project' : 'User'} ID`}
                  className="bg-transparent outline-none w-44 text-gray-700 placeholder-gray-400 text-xs font-mono"
                />
              </div>
            )}

            <DateRangePicker
              value={{ from: dateFrom, to: dateTo }}
              onChange={(range) => setParams({ dateFrom: range.from || undefined, dateTo: range.to || undefined, page: undefined })}
              label="Date"
            />

          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-5">
              <TableSkeleton rows={12} cols={6} />
            </div>
          ) : isError ? (
            <div className="py-8 px-5">
              <ErrorMessage message={(error as ApiError)?.message ?? 'Failed to load audit logs'} />
            </div>
          ) : (
            <AuditLogTable
              logs={logs}
              startEntry={startEntry}
              viewLogId={viewId ?? null}
              onView={(id) => setParams({ viewId: id })}
              onCloseView={() => setParams({ viewId: undefined })}
            />
          )}
        </div>

      </div>

      {/* Pagination footer */}
      {!isLoading && !isError && totalPages > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          startEntry={startEntry}
          endEntry={endEntry}
          limit={limit}
          hasPrevPage={pagination?.hasPrevPage}
          hasNextPage={pagination?.hasNextPage}
          onPageChange={(p) => setParams({ page: p > 1 ? p : undefined })}
          onLimitChange={(l) => setParams({ limit: l !== 20 ? l : undefined, page: undefined })}
        />
      )}
    </div>
  )
}
