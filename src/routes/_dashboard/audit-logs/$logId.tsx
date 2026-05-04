import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, User, Building2, Globe, Clock, Tag, FolderKanban } from 'lucide-react'
import { useAuditLog } from '../../../queries/audit-logs.queries'
import { formatDateTime, formatDate } from '../../../lib/utils'
import ErrorMessage from '../../../components/common/ErrorMessage'
import type { ApiError } from '../../../types/api.types'
import type { AuditLog } from '../../../types/audit-log.types'

export const Route = createFileRoute('/_dashboard/audit-logs/$logId')({
  component: AuditLogDetailPage,
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTION_STYLE: Record<string, string> = {
  created:         'bg-green-100 text-green-700 border border-green-200',
  updated:         'bg-amber-100 text-amber-700 border border-amber-200',
  deleted:         'bg-red-100 text-red-700 border border-red-200',
  status_updated:  'bg-blue-100 text-blue-700 border border-blue-200',
  admin_assigned:  'bg-violet-100 text-violet-700 border border-violet-200',
  developer_added: 'bg-teal-100 text-teal-700 border border-teal-200',
  member_removed:  'bg-rose-100 text-rose-700 border border-rose-200',
  member_added:    'bg-cyan-100 text-cyan-700 border border-cyan-200',
}

const ENTITY_STYLE: Record<string, string> = {
  task:         'bg-blue-100 text-blue-700',
  project:      'bg-violet-100 text-violet-700',
  user:         'bg-teal-100 text-teal-700',
  organization: 'bg-orange-100 text-orange-700',
}

// Fields that are internal noise — skip in diff view
const SKIP = new Set(['id', 'orgId', 'createdBy', 'createdAt', 'updatedAt', 'deletedAt', 'completedAt', 'parentTaskId', 'projectId'])

const LABELS: Record<string, string> = {
  title:       'Title',
  name:        'Name',
  description: 'Description',
  status:      'Status',
  priority:    'Priority',
  dueDate:     'Due Date',
  logoUrl:     'Logo URL',
  email:       'Email',
  role:        'Role',
  avatarUrl:   'Avatar URL',
  slug:        'Slug',
  members:     'Members',
  creator:     'Creator',
  assignees:   'Assignees',
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

// ─── Snapshot cards (Before / After) ─────────────────────────────────────────

function SnapshotCards({ log }: { log: AuditLog }) {
  const { before, after } = log
  if (!before && !after) return null

  const keys = Array.from(
    new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  ).filter((k) => !SKIP.has(k))

  return (
    <div className="grid grid-cols-2 gap-4">

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-red-50">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Before</p>
        </div>
        {before ? (
          <table className="w-full text-sm">
            <tbody>
              {keys.map((key) => (
                <tr key={key} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-2.5 text-xs font-medium text-gray-400 w-32 align-top">{displayLabel(key)}</td>
                  <td className="px-5 py-2.5 text-xs text-gray-700 align-top">{displayValue(before[key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-8 text-xs text-gray-400 text-center">No prior state</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-green-50">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">After</p>
        </div>
        {after ? (
          <table className="w-full text-sm">
            <tbody>
              {keys.map((key) => (
                <tr key={key} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-2.5 text-xs font-medium text-gray-400 w-32 align-top">{displayLabel(key)}</td>
                  <td className="px-5 py-2.5 text-xs text-gray-700 align-top">{displayValue(after[key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-8 text-xs text-gray-400 text-center">No new state</p>
        )}
      </div>

    </div>
  )
}

// ─── Changes section ─────────────────────────────────────────────────────────

function ChangesSection({ log }: { log: AuditLog }) {
  const before = log.before
  const after  = log.after

  if (!before && !after) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <p className="text-sm text-gray-400 text-center">No snapshot data available for this event.</p>
      </div>
    )
  }

  // Collect all relevant keys
  const allKeys = Array.from(
    new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  ).filter((k) => !SKIP.has(k))

  // For "created" — show the new state as a simple table
  if (!before && after) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-green-50">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Created — New State</p>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {allKeys.map((key) => (
              <tr key={key} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-2.5 text-xs font-medium text-gray-500 w-40 align-top">{displayLabel(key)}</td>
                <td className="px-5 py-2.5 text-xs text-gray-800">{displayValue(after[key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // For "deleted" — show the last known state
  if (before && !after) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-red-50">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Deleted — Last Known State</p>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {allKeys.map((key) => (
              <tr key={key} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-2.5 text-xs font-medium text-gray-500 w-40 align-top">{displayLabel(key)}</td>
                <td className="px-5 py-2.5 text-xs text-gray-500 line-through">{displayValue(before[key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // For "updated" — show a diff (only changed fields + all fields)
  if (before && after) {
    const changed = allKeys.filter((k) => {
      const b = displayValue(before[k])
      const a = displayValue(after[k])
      return b !== a
    })

    return (
      <div className="space-y-4">
        {/* Changed fields */}
        {changed.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-amber-50">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                Changed Fields ({changed.length})
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                  <th className="px-5 py-2 text-left w-40">Field</th>
                  <th className="px-5 py-2 text-left">Before</th>
                  <th className="px-5 py-2 text-left">After</th>
                </tr>
              </thead>
              <tbody>
                {changed.map((key) => (
                  <tr key={key} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-2.5 text-xs font-medium text-gray-500 align-top">{displayLabel(key)}</td>
                    <td className="px-5 py-2.5 text-xs text-red-500 bg-red-50/40 align-top">{displayValue(before[key])}</td>
                    <td className="px-5 py-2.5 text-xs text-green-700 bg-green-50/40 align-top">{displayValue(after[key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    )
  }

  return null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AuditLogDetailPage() {
  const { logId } = Route.useParams()
  const navigate  = useNavigate()

  const { data: log, isLoading, isError, error } = useAuditLog(logId)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse p-1">
        <div className="h-8 w-48 bg-gray-100 rounded-lg" />
        <div className="h-28 bg-gray-100 rounded-xl" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (isError || !log) {
    return (
      <div className="py-10">
        <ErrorMessage message={(error as ApiError)?.message ?? 'Failed to load audit log'} />
      </div>
    )
  }

  const verb      = log.action.split('.')[1] ?? log.action
  const verbLabel = verb.replace(/_/g, ' ').replace(/^./, (s) => s.toUpperCase())
  const actionCls = ACTION_STYLE[verb] ?? 'bg-gray-100 text-gray-600 border border-gray-200'
  const entCls    = ENTITY_STYLE[log.entityType] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto flex-1">

      {/* Back */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: '/audit-logs', search: {} as any })}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          Audit Logs
        </button>
      </div>

      {/* Description card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${actionCls}`}>
            {verbLabel}
          </span>
          {log.entityName && (
            <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${entCls}`}>
              {log.entityName}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
        <p className="text-sm text-gray-700 leading-relaxed">{log.description ?? log.action}</p>
      </div>

      {/* Meta cards row */}
      <div className={`grid grid-cols-2 gap-3 ${log.entityType === 'task' && log.projectName ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>

        {/* Actor */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <User size={15} className="text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Actor</p>
            <p className="text-sm font-medium text-gray-800 truncate">{log.actor.name}</p>
            <p className="text-xs text-gray-400 truncate">{log.actor.email}</p>
          </div>
        </div>

        {/* Organization */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Building2 size={15} className="text-orange-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Organization</p>
            <p className="text-sm font-medium text-gray-800 truncate">{log.organization.name}</p>
            <p className="text-xs text-gray-400 truncate">{log.organization.slug}</p>
          </div>
        </div>

        {/* Entity */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Tag size={15} className="text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Entity</p>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${entCls}`}>
              {log.entityType}
            </span>
            <p className="text-xs text-gray-600 mt-0.5 truncate">{log.entityName ?? <span className="font-mono">{log.entityId.slice(0, 12)}…</span>}</p>
          </div>
        </div>

        {/* Project — only for task entities */}
        {log.entityType === 'task' && log.projectName && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
              <FolderKanban size={15} className="text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Project</p>
              <p className="text-sm font-medium text-gray-800 truncate">{log.projectName}</p>
            </div>
          </div>
        )}

        {/* Time + IP */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Clock size={15} className="text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Time</p>
            <p className="text-xs font-medium text-gray-800">{formatDateTime(log.createdAt)}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Globe size={10} className="text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-400 font-mono truncate">{log.ipAddress}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Changes — Before / After */}
      {(log.before || log.after) && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Changes</p>
          <SnapshotCards log={log} />
        </div>
      )}

      {/* Changed fields diff */}
      <ChangesSection log={log} />

    </div>
  )
}
