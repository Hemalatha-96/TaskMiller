import { Fragment, useState } from 'react'
import { ChevronRight, ChevronDown, ArrowRight } from 'lucide-react'
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
    year:   'numeric',
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
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

function computeDiff(
  before: string | Record<string, unknown> | null,
  after:  string | Record<string, unknown> | null,
): Array<{ field: string; from: unknown; to: unknown }> {
  const b = parseField(before)
  const a = parseField(after)
  if (!b && !a) return []
  const allKeys = new Set([...Object.keys(b ?? {}), ...Object.keys(a ?? {})])
  const diffs: Array<{ field: string; from: unknown; to: unknown }> = []
  for (const key of allKeys) {
    const bVal = b?.[key] ?? null
    const aVal = a?.[key] ?? null
    if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      diffs.push({ field: key, from: bVal, to: aVal })
    }
  }
  return diffs
}

interface Props {
  logs:       AuditLog[]
  startEntry: number
}

export default function AuditLogTable({ logs, startEntry }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (logs.length === 0) {
    return <div className="py-16 text-center text-sm text-gray-400">No audit logs found</div>
  }

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-gray-200 text-xs text-gray-600 font-semibold uppercase tracking-wide">
          <th className="px-4 py-3 text-left w-10 bg-[#ccfbf1]">S.No</th>
          <th className="px-4 py-3 text-left bg-[#ccfbf1]">Entity</th>
          <th className="px-4 py-3 text-left bg-[#ccfbf1]">Action</th>
          <th className="px-4 py-3 text-left bg-[#ccfbf1]">Description</th>
          <th className="px-4 py-3 text-left bg-[#ccfbf1]">Actor</th>
          <th className="px-4 py-3 text-left bg-[#ccfbf1]">Time</th>
          <th className="px-4 py-3 w-10 bg-[#ccfbf1]" />
        </tr>
      </thead>
      <tbody>
        {logs.map((log, idx) => {
          const { label, cls } = actionStyle(log.action)
          const entCls    = entityStyle[log.entityType] ?? 'bg-gray-100 text-gray-600'
          const isExpanded = expandedId === log.id

          const changes = (log.changes && log.changes.length > 0)
            ? log.changes.map((c) => ({ field: c.field, from: c.from, to: c.to }))
            : computeDiff(log.before, log.after)

          return (
            <Fragment key={log.id}>
              <tr className={`border-b border-gray-50 transition-colors align-top ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>

                {/* S.No */}
                <td className="px-4 py-3 text-gray-400 text-xs">{startEntry + idx}</td>

                {/* Entity (Task Name) */}
                <td className="px-4 py-3">
                  {log.entityName ? (
                    <p className="text-xs font-semibold text-gray-800">{log.entityName}</p>
                  ) : (
                    <p className="text-xs font-semibold text-gray-800 font-mono">{log.entityId.slice(0, 8)}…</p>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize mt-1 inline-block ${entCls}`}>
                    {log.entityType}
                  </span>
                </td>

                {/* Action */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${cls}`}>{label}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{log.action}</p>
                </td>

                {/* Description */}
                <td className="px-4 py-3 min-w-[200px] max-w-[340px]">
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-normal break-words">
                    {log.description ?? '—'}
                  </p>
                </td>

                {/* Actor */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-xs font-medium text-gray-800">{log.actor.name}</p>
                  <p className="text-xs text-gray-400">{log.actor.email}</p>
                </td>

                {/* Time — full date & time */}
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(log.createdAt)}
                </td>

                {/* Expand toggle */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    title={isExpanded ? 'Collapse' : 'View changes'}
                  >
                    {isExpanded
                      ? <ChevronDown  size={15} />
                      : <ChevronRight size={15} />}
                  </button>
                </td>
              </tr>

              {/* Inline changes row */}
              {isExpanded && (
                <tr className="border-b border-blue-100 bg-blue-50">
                  <td colSpan={7} className="px-8 py-4">
                    {changes.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mb-3">
                          Changes Made
                        </p>
                        {changes.map((c, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-gray-600 w-32 flex-shrink-0 capitalize">
                              {formatFieldName(c.field)}
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-red-100 text-red-600 font-medium">
                              {formatFieldValue(c.field, c.from)}
                            </span>
                            <ArrowRight size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-green-100 text-green-700 font-semibold">
                              {formatFieldValue(c.field, c.to)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No changes recorded for this entry.</p>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          )
        })}
      </tbody>
    </table>
  )
}
