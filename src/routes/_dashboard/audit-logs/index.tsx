import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Eye } from 'lucide-react'
import { useAuditLogs } from '../../../lib/queries/audit-logs.queries'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { ErrorMessage } from '../../../components/common/ErrorMessage'
import { Pagination } from '../../../components/ui/Pagination'
import { Modal } from '../../../components/ui/modal'
import { useModal } from '../../../hooks/useModal'
import { useDebounce } from '../../../hooks/useDebounce'
import { useAuth } from '../../../hooks/useAuth'
import { useOrgStore } from '../../../store/org.store'
import { cn } from '../../../utils/cn'
import type { AuditLog } from '../../../types/audit-log.types'

export const Route = createFileRoute('/_dashboard/audit-logs/')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || undefined,
    page: Number(search.page) > 1 ? Number(search.page) : undefined,
  }),
  component: AuditLogsPage,
})

const PAGE_SIZE = 20

function stringifyValue(value: unknown): string {
  if (value == null) return 'null'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function AuditLogsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const detailsModal = useModal<AuditLog>()

  const { isAdmin, isSuperAdmin, orgId } = useAuth()
  const { activeOrgId } = useOrgStore()
  const effectiveOrgId = isSuperAdmin ? (activeOrgId ?? undefined) : (orgId ?? undefined)

  const debouncedQ = useDebounce(search.q ?? '', 350)

  const { data, isLoading, error } = useAuditLogs({
    page: search.page ?? 1,
    limit: PAGE_SIZE,
    search: debouncedQ || undefined,
    orgId: effectiveOrgId,
  })

  const logs = data?.data ?? []

  const empty = !isLoading && !error && logs.length === 0

  const setFilter = (updates: Record<string, string | undefined>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...Object.fromEntries(Object.entries(updates).map(([k, v]) => [k, v === '' ? undefined : v])),
        page: undefined,
      }),
      replace: true,
    })
  }

  const setPage = (page: number) => {
    navigate({ search: (prev) => ({ ...prev, page: page > 1 ? page : undefined }), replace: true })
  }

  const title = useMemo(() => {
    if (!isAdmin) return 'Audit Logs'
    return debouncedQ ? `Audit Logs (${data?.total ?? 0} results)` : `Audit Logs (${data?.total ?? 0} total)`
  }, [isAdmin, debouncedQ, data?.total])

  if (!isAdmin) {
    return <ErrorMessage message="You don’t have access to audit logs." />
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      <div className="flex-shrink-0 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">Track changes across your organization.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search.q || ''}
            onChange={(e) => setFilter({ q: e.target.value })}
            placeholder="Search by action, entity, actor..."
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#F4622A] focus:ring-1 focus:ring-[#F4622A]/20 min-w-[260px]"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={(error as any)?.message ?? 'Failed to load audit logs.'} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-full min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 z-10 bg-white border-b border-gray-50">
                  {['Action', 'Entity', 'Actor', 'IP', 'When', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-gray-800 whitespace-nowrap">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <span className="capitalize">{String(log.entityType ?? '').replace(/_/g, ' ')}</span>
                        {log.entityId ? <span className="text-gray-300">•</span> : null}
                        {log.entityId ? <span className="text-gray-500 font-mono">{log.entityId.slice(0, 8)}…</span> : null}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {log.actor?.name ?? (log.actorId ? `${log.actorId.slice(0, 8)}…` : '—')}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{log.ipAddress ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => detailsModal.open(log)}
                        className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition', 'text-[#F4622A] border-orange-200 hover:bg-orange-50')}
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {empty && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">No audit logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex-shrink-0">
            <Pagination
              page={search.page ?? 1}
              totalPages={data?.totalPages ?? 1}
              total={data?.total ?? 0}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          </div>
        </div>
      )}
      </div>

      <Modal isOpen={detailsModal.isOpen} onClose={detailsModal.close} title="Audit Log Details" size="xl">
        {detailsModal.data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Action', value: detailsModal.data.action },
                { label: 'Entity', value: `${detailsModal.data.entityType} • ${detailsModal.data.entityId}` },
                { label: 'Actor', value: detailsModal.data.actor?.name ?? detailsModal.data.actorId },
                { label: 'Organization', value: detailsModal.data.organization?.name ?? detailsModal.data.orgId },
                { label: 'IP Address', value: detailsModal.data.ipAddress ?? '—' },
                { label: 'Created At', value: formatDateTime(detailsModal.data.createdAt) },
              ].map((row) => (
                <div key={row.label}>
                  <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
                  <p className="text-sm font-medium text-gray-800 break-words">{row.value || '—'}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Before</p>
                <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-[380px] whitespace-pre-wrap break-words">
                  {stringifyValue(detailsModal.data.before)}
                </pre>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">After</p>
                <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-[380px] whitespace-pre-wrap break-words">
                  {stringifyValue(detailsModal.data.after)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
