import { Fragment, useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { formatRelativeTime } from '../../lib/utils'
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

interface Props {
  logs: AuditLog[]
  startEntry: number
}

export default function AuditLogTable({ logs, startEntry }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (logs.length === 0) {
    return <div className="py-16 text-center text-sm text-gray-400">No audit logs found</div>
  }

  return (
    <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-gray-200 text-xs text-gray-600 font-semibold uppercase tracking-wide">
            <th className="px-5 py-3 text-left w-10 bg-[#ccfbf1]">S.no</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Actor</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Action</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Entity</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">IP Address</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Time</th>
            <th className="px-5 py-3 w-10 bg-[#ccfbf1]" />
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => {
            const { label, cls } = actionStyle(log.action)
            const entCls = entityStyle[log.entityType] ?? 'bg-gray-100 text-gray-600'
            const isOpen = expanded === log.id

            let afterJson: string | null = null
            try {
              if (log.after) afterJson = JSON.stringify(JSON.parse(log.after), null, 2)
            } catch { /* invalid json — skip expand */ }

            return (
              <Fragment key={log.id}>
                <tr className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isOpen ? 'bg-gray-50' : ''}`}>
                  <td className="px-5 py-3 text-gray-400 text-xs">{startEntry + idx}</td>

                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{log.actor.name}</p>
                    <p className="text-xs text-gray-400">{log.actor.email}</p>
                  </td>

                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${cls}`}>{label}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{log.action}</p>
                  </td>

                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${entCls}`}>
                      {log.entityType}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{log.entityId.slice(0, 8)}…</p>
                  </td>

                  <td className="px-5 py-3 text-xs text-gray-500 font-mono">{log.ipAddress}</td>

                  <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {formatRelativeTime(log.createdAt)}
                  </td>

                  <td className="px-5 py-3">
                    {afterJson && (
                      <button
                        onClick={() => setExpanded(isOpen ? null : log.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="View details"
                      >
                        {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </button>
                    )}
                  </td>
                </tr>

                {isOpen && afterJson && (
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td colSpan={7} className="px-5 py-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Snapshot (after)</p>
                      <pre className="text-xs text-gray-600 overflow-x-auto max-h-64 bg-white border border-gray-200 rounded-lg p-3 font-mono leading-relaxed">
                        {afterJson}
                      </pre>
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
