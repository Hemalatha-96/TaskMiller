import { useState, useEffect, useRef } from 'react'
import { X, Eye } from 'lucide-react'
import { formatDateTime, formatDate } from '../../lib/utils'
import Tooltip from '../ui/Tooltip'
import type { AuditLog } from '../../types/audit-log.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SKIP = new Set(['id', 'orgId', 'createdBy', 'createdAt', 'updatedAt', 'deletedAt', 'completedAt', 'parentTaskId', 'projectId'])

const LABELS: Record<string, string> = {
  title: 'Title', name: 'Name', description: 'Description', status: 'Status',
  priority: 'Priority', dueDate: 'Due Date', logoUrl: 'Logo URL', email: 'Email',
  role: 'Role', avatarUrl: 'Avatar URL', slug: 'Slug', members: 'Members',
  creator: 'Creator', assignees: 'Assignees',
}

function displayLabel(key: string): string {
  return LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
}

function displayValue(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (Array.isArray(val)) {
    if (val.length === 0) return '(empty)'
    const first = val[0]
    if (typeof first === 'object' && first !== null && 'name' in first)
      return val.map((v: any) => v.name ?? v.email ?? v.id).join(', ')
    return String(val.length) + ' item(s)'
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>
    return (obj.name ?? obj.title ?? obj.email ?? obj.id ?? JSON.stringify(val)) as string
  }
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val))
    return formatDate(val)
  return String(val)
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const actionStyle = (action: string): { label: string; cls: string } => {
  const verb = action.split('.')[1] ?? action
  const label = verb.replace(/_/g, ' ').replace(/^./, (s) => s.toUpperCase())
  const map: Record<string, string> = {
    created:          'bg-green-100 text-green-700',
    updated:          'bg-amber-100 text-amber-700',
    deleted:          'bg-red-100 text-red-700',
    status_updated:   'bg-blue-100 text-blue-700',
    admin_assigned:   'bg-violet-100 text-violet-700',
    developer_added:  'bg-teal-100 text-teal-700',
    member_removed:   'bg-rose-100 text-rose-700',
    member_added:     'bg-cyan-100 text-cyan-700',
  }
  return { label, cls: map[verb] ?? 'bg-gray-100 text-gray-600' }
}

const entityStyle: Record<string, string> = {
  task:         'text-blue-500',
  project:      'text-violet-500',
  user:         'text-teal-500',
  organization: 'text-orange-500',
}

// ─── Drawer content ───────────────────────────────────────────────────────────

const PAGE = 30

function DrawerChanges({ log }: { log: AuditLog }) {
  const [visibleCount, setVisibleCount] = useState(PAGE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setVisibleCount(PAGE) }, [log])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount((c) => c + PAGE) },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [log])

  const { before, after } = log

  if (!before && !after) {
    return <p className="text-sm text-gray-400 text-center py-8">No snapshot data</p>
  }

  const allKeys = Array.from(
    new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  ).filter((k) => !SKIP.has(k))

  if (!before && after) {
    const visible = allKeys.slice(0, visibleCount)
    return (
      <div>
        <div className="px-4 py-2.5 bg-green-50 border-b border-green-100 mb-3">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Created — New State</p>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {visible.map((key) => (
              <tr key={key} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-2 font-medium text-gray-400 w-32 align-top">{displayLabel(key)}</td>
                <td className="px-4 py-2 text-gray-700 align-top">{displayValue(after[key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {allKeys.length > visibleCount && <div ref={sentinelRef} className="h-6" />}
      </div>
    )
  }

  if (before && !after) {
    const visible = allKeys.slice(0, visibleCount)
    return (
      <div>
        <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 mb-3">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Deleted — Last Known State</p>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {visible.map((key) => (
              <tr key={key} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-2 font-medium text-gray-400 w-32 align-top">{displayLabel(key)}</td>
                <td className="px-4 py-2 text-gray-700 align-top">{displayValue(before[key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {allKeys.length > visibleCount && <div ref={sentinelRef} className="h-6" />}
      </div>
    )
  }

  if (before && after) {
    const changed = allKeys.filter((k) => displayValue(before[k]) !== displayValue(after[k]))
    if (changed.length === 0) {
      return <p className="text-sm text-gray-400 text-center py-8">No field changes detected</p>
    }
    const visible = changed.slice(0, visibleCount)
    return (
      <div>
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 mb-3">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
            Changed Fields ({changed.length})
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 font-medium text-xs">
              <th className="px-4 py-2 text-left w-28">Field</th>
              <th className="px-4 py-2 text-left">Before</th>
              <th className="px-4 py-2 text-left">After</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((key) => (
              <tr key={key} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-2 font-medium text-gray-500 align-top">{displayLabel(key)}</td>
                <td className="px-4 py-2 text-gray-500 align-top line-through">{displayValue(before[key])}</td>
                <td className="px-4 py-2 text-gray-800 font-medium align-top">{displayValue(after[key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {changed.length > visibleCount && <div ref={sentinelRef} className="h-6" />}
      </div>
    )
  }

  return null
}

// ─── Table ────────────────────────────────────────────────────────────────────

interface Props {
  logs: AuditLog[]
  startEntry: number
}

export default function AuditLogTable({ logs, startEntry }: Props) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  if (logs.length === 0) {
    return <div className="py-16 text-center text-sm text-gray-400">No audit logs found</div>
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-gray-200 text-xs text-gray-600 font-semibold uppercase tracking-wide">
            <th className="px-5 py-3 text-left w-10 bg-[#ccfbf1]">S.no</th>
            <th className="pl-2 pr-3 py-3 text-left bg-[#ccfbf1]">Entity</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Action</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Description</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Actor</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Time Stamps</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => {
            const { label, cls } = actionStyle(log.action)
            const entCls = entityStyle[log.entityType] ?? 'text-gray-400'
            const hasChanges = !!(log.before || log.after)

            return (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-gray-400 text-xs">{startEntry + idx}</td>

                <td className="pl-2 pr-3 py-3 w-[220px]">
                  {log.entityName && log.entityName.length > 18 ? (
                    <Tooltip label={log.entityName}>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs font-medium text-gray-800 truncate">
                          {log.entityName}
                        </span>
                        <span className={`text-xs font-medium capitalize flex-shrink-0 ${entCls}`}>
                          [{log.entityType}]
                        </span>
                      </div>
                    </Tooltip>
                  ) : (
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-xs font-medium text-gray-800 truncate">
                        {log.entityName ?? <span className="font-mono text-gray-400">{log.entityId.slice(0, 8)}…</span>}
                      </span>
                      <span className={`text-xs font-medium capitalize flex-shrink-0 ${entCls}`}>
                        [{log.entityType}]
                      </span>
                    </div>
                  )}
                </td>

                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${cls}`}>{label}</span>
                </td>

                <td className="px-5 py-3 text-xs text-gray-500 max-w-xs">
                  {log.description && log.description.length > 60 ? (
                    <Tooltip label={log.description} wrap>
                      <span className="line-clamp-2">{log.description}</span>
                    </Tooltip>
                  ) : (
                    log.description ?? '—'
                  )}
                </td>

                <td className="px-5 py-3">
                  <p className="font-medium text-gray-800 text-xs">{log.actor.name}</p>
                  <p className="text-xs text-gray-400">{log.actor.email}</p>
                </td>

                <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </td>

                <td className="px-5 py-3 text-center">
                  {hasChanges && (
                    <Tooltip label="View changes">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-gray-400 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        <Eye size={14} />
                      </button>
                    </Tooltip>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Right-side drawer */}
      {selectedLog && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setSelectedLog(null)}
          />

          {/* Drawer panel */}
          <div className="fixed top-0 right-0 h-full w-[420px] bg-white z-50 shadow-2xl flex flex-col">

            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <p className="text-sm font-semibold text-gray-800">Audit Log Detail</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-xs text-gray-500 font-medium">
                    {selectedLog.entityName ?? selectedLog.entityId.slice(0, 8) + '…'}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${entityStyle[selectedLog.entityType] ?? 'bg-gray-100 text-gray-600'}`}>
                    {selectedLog.entityType}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${actionStyle(selectedLog.action).cls}`}>
                    {actionStyle(selectedLog.action).label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Meta */}
            <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0 flex items-center justify-between text-xs text-gray-400">
              <span>By <span className="text-gray-600 font-medium">{selectedLog.actor.name}</span></span>
              <span>{formatDateTime(selectedLog.createdAt)}</span>
            </div>

            {/* Changes */}
            <div className="flex-1 overflow-y-auto">
              <DrawerChanges log={selectedLog} />
            </div>

          </div>
        </>
      )}
    </>
  )
}
