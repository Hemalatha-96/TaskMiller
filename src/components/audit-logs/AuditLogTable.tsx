import { Eye, X, ArrowRight, Loader2 } from 'lucide-react'
import { formatRelativeTime } from '../../lib/utils'
import { useAuditLogById } from '../../queries/audit-logs.queries'
import type { AuditLog } from '../../types/audit-log.types'

const actionStyle = (action: string): { label: string; cls: string } => {
  const verb = action.split('.')[1] ?? action
  const map: Record<string, string> = {
    created: 'bg-green-100 text-green-700',
    updated: 'bg-amber-100 text-amber-700',
    deleted: 'bg-red-100 text-red-700',
  }
  return {
    label: verb.charAt(0).toUpperCase() + verb.slice(1),
    cls:   map[verb] ?? 'bg-gray-100 text-gray-600',
  }
}

const entityStyle: Record<string, string> = {
  task:    'bg-blue-100 text-blue-700',
  project: 'bg-violet-100 text-violet-700',
  user:    'bg-teal-100 text-teal-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatFieldValue(key: string, val: unknown): string {
  if (val === null || val === undefined || val === '') return '—'

  if (Array.isArray(val)) {
    if (val.length === 0) return '—'
    const names = val
      .map((item) =>
        typeof item === 'object' && item !== null
          ? (item as Record<string, unknown>).name ?? (item as Record<string, unknown>).email ?? null
          : null,
      )
      .filter(Boolean)
    return names.length > 0 ? (names as string[]).join(', ') : `${val.length} item${val.length > 1 ? 's' : ''}`
  }

  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>
    if (obj.name)  return String(obj.name)
    if (obj.title) return String(obj.title)
    if (obj.email) return String(obj.email)
    return '—'
  }

  if (key.toLowerCase().includes('date') && typeof val === 'string' && val.includes('T')) {
    try {
      return new Date(val).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    } catch { /* fall through */ }
  }

  if (typeof val === 'string') {
    return val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return String(val)
}

function parseField(raw: string | Record<string, unknown> | null): Record<string, unknown> | null {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

function KeyValueCard({
  data,
  changedFields = [],
  side = 'none',
}: {
  data: Record<string, unknown> | null
  changedFields?: string[]
  side?: 'before' | 'after' | 'none'
}) {
  if (!data) return <span className="text-gray-400 text-xs italic">—</span>
  const entries = Object.entries(data)
  if (entries.length === 0) return <span className="text-gray-400 text-xs italic">Empty</span>

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {entries.map(([key, val], i) => {
        const isChanged = changedFields.includes(key)
        const rowBg    = isChanged ? (side === 'before' ? 'bg-red-50' : side === 'after' ? 'bg-green-50' : 'bg-white') : 'bg-white'
        const labelCls = isChanged ? (side === 'before' ? 'text-red-500' : side === 'after' ? 'text-green-600' : 'text-gray-400') : 'text-gray-400'
        const valueCls = isChanged
          ? side === 'before' ? 'text-red-600 line-through' : side === 'after' ? 'text-green-700 font-semibold' : 'text-gray-700'
          : 'text-gray-700'

        return (
          <div
            key={key}
            className={`flex items-start gap-3 px-3 py-2 text-xs ${i !== entries.length - 1 ? 'border-b border-gray-100' : ''} ${rowBg}`}
          >
            <span className={`font-medium w-28 flex-shrink-0 ${labelCls}`}>{formatFieldName(key)}</span>
            <span className={`break-all ${valueCls}`}>{formatFieldValue(key, val)}</span>
          </div>
        )
      })}
    </div>
  )
}

function ModalSkeleton() {
  return (
    <div className="px-6 py-5 space-y-4 animate-pulse">
      <div className="h-14 bg-gray-100 rounded-xl" />
      <div className="h-20 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-gray-100 rounded-xl" />
        <div className="h-16 bg-gray-100 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="h-14 bg-gray-100 rounded-xl" />
        <div className="h-14 bg-gray-100 rounded-xl" />
        <div className="h-14 bg-gray-100 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-40 bg-gray-100 rounded-xl" />
        <div className="h-40 bg-gray-100 rounded-xl" />
      </div>
    </div>
  )
}

function AuditLogModal({ logId, onClose }: { logId: string; onClose: () => void }) {
  const { data: log, isLoading, isError } = useAuditLogById(logId)

  const beforeData    = log ? parseField(log.before)  : null
  const afterData     = log ? parseField(log.after)   : null
  const changedFields = (log?.changes ?? []).map((c) => c.field)
  const { label, cls } = log ? actionStyle(log.action) : { label: '', cls: '' }
  const entCls         = log ? (entityStyle[log.entityType] ?? 'bg-gray-100 text-gray-600') : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Audit Log Details</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-xs">{logId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {isLoading ? (
          <ModalSkeleton />
        ) : isError || !log ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            Failed to load audit log details.
          </div>
        ) : (
          <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm">

            {/* Summary */}
            {log.description && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Summary</p>
                <p className="text-xs text-gray-700 leading-relaxed">{log.description}</p>
              </div>
            )}

            {/* Changes */}
            {log.changes && log.changes.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Changes</p>
                <div className="space-y-2">
                  {log.changes.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                      <span className="text-xs font-semibold text-gray-600 w-24 flex-shrink-0 capitalize">
                        {formatFieldName(c.field)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-red-100 text-red-600 font-medium">
                        {formatFieldValue(c.field, c.from)}
                      </span>
                      <ArrowRight size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-green-100 text-green-700 font-semibold">
                        {formatFieldValue(c.field, c.to)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action + Entity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Action</p>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${cls}`}>{label}</span>
                <p className="text-xs text-gray-400 mt-1.5">{log.action}</p>
              </div>
              <div className="border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Entity</p>
                <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${entCls}`}>{log.entityType}</span>
                {log.entityName && <p className="text-xs text-gray-700 font-medium mt-1.5">{log.entityName}</p>}
                <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{log.entityId}</p>
              </div>
            </div>

            {/* Organization */}
            <div className="border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Organization</p>
              <p className="text-xs text-gray-700 font-medium">{log.organization.name}</p>
              <p className="text-xs text-gray-400">{log.organization.slug}</p>
            </div>

            {/* Project + Parent Task */}
            {(log.projectName || log.parentTaskName) && (
              <div className="grid grid-cols-2 gap-3">
                {log.projectName && (
                  <div className="border border-gray-200 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Project</p>
                    <p className="text-xs text-gray-700 font-medium">{log.projectName}</p>
                  </div>
                )}
                {log.parentTaskName && (
                  <div className="border border-gray-200 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Parent Task</p>
                    <p className="text-xs text-gray-700 font-medium">{log.parentTaskName}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actor + IP + Time */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Actor</p>
                <p className="text-xs font-medium text-gray-800">{log.actor.name}</p>
                <p className="text-xs text-gray-400 truncate">{log.actor.email}</p>
              </div>
              <div className="border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">IP Address</p>
                <p className="text-xs text-gray-700 font-mono">{log.ipAddress}</p>
              </div>
              <div className="border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Timestamp</p>
                <p className="text-xs text-gray-700">{formatDate(log.createdAt)}</p>
              </div>
            </div>

            {/* Before / After */}
            {(beforeData || afterData) && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Before</p>
                  <KeyValueCard data={beforeData} changedFields={changedFields} side="before" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">After</p>
                  <KeyValueCard data={afterData} changedFields={changedFields} side="after" />
                </div>
              </div>
            )}

          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          {isLoading && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 size={12} className="animate-spin" /> Fetching details…
            </span>
          )}
          <div className="ml-auto">
            <button
              onClick={onClose}
              className="text-xs px-4 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

interface Props {
  logs:         AuditLog[]
  startEntry:   number
  viewLogId:    string | null
  onView:       (id: string) => void
  onCloseView:  () => void
}

export default function AuditLogTable({ logs, startEntry, viewLogId, onView, onCloseView }: Props) {

  if (logs.length === 0) {
    return <div className="py-16 text-center text-sm text-gray-400">No audit logs found</div>
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-gray-200 text-xs text-gray-600 font-semibold uppercase tracking-wide">
            <th className="px-4 py-3 text-left w-10 bg-[#ccfbf1]">S.no</th>
            <th className="px-4 py-3 text-left bg-[#ccfbf1]">Actor</th>
            <th className="px-4 py-3 text-left bg-[#ccfbf1]">Action</th>
            <th className="px-4 py-3 text-left bg-[#ccfbf1]">Entity</th>
            <th className="px-4 py-3 text-left bg-[#ccfbf1]">Organization</th>
            <th className="px-4 py-3 text-left bg-[#ccfbf1]">Description</th>
            <th className="px-4 py-3 text-left bg-[#ccfbf1]">IP Address</th>
            <th className="px-4 py-3 text-left bg-[#ccfbf1]">Time</th>
            <th className="px-4 py-3 text-center bg-[#ccfbf1]">View</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => {
            const { label, cls } = actionStyle(log.action)
            const entCls = entityStyle[log.entityType] ?? 'bg-gray-100 text-gray-600'

            return (
              <tr
                key={log.id}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors align-top"
              >
                <td className="px-4 py-3 text-gray-400 text-xs">{startEntry + idx}</td>

                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800 text-xs whitespace-nowrap">{log.actor.name}</p>
                  <p className="text-xs text-gray-400 whitespace-nowrap">{log.actor.email}</p>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${cls}`}>{label}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{log.action}</p>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${entCls}`}>
                    {log.entityType}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{log.entityId.slice(0, 8)}…</p>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-xs font-medium text-gray-700">{log.organization.name}</p>
                  <p className="text-xs text-gray-400">{log.organization.slug}</p>
                </td>

                <td className="px-4 py-3 min-w-[220px] max-w-[320px]">
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-normal break-words">
                    {log.description ?? '—'}
                  </p>
                </td>

                <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">{log.ipAddress}</td>

                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {formatRelativeTime(log.createdAt)}
                </td>

                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onView(log.id)}
                    className="text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                    title="View details"
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {viewLogId && <AuditLogModal logId={viewLogId} onClose={onCloseView} />}
    </>
  )
}
