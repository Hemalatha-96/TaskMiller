import { Building2, Eye, Loader2 } from 'lucide-react'
import type { Organization } from '../../types/org.types'
import { userColor } from '../../lib/utils'
import { useProjects } from '../../queries/projects.queries'
import { useTasks } from '../../queries/tasks.queries'

interface OrgTableProps {
  orgs:   Organization[]
  onView: (org: Organization) => void
}

function OrgTableRow({ org, idx, onView }: { org: Organization; idx: number; onView: (org: Organization) => void }) {
  const { data: projData,  isLoading: isProjLoading  } = useProjects({ orgId: org.id, limit: 1 })
  const { data: tasksData, isLoading: isTasksLoading } = useTasks({ orgId: org.id, limit: 1 })
  const isLoading = isProjLoading || isTasksLoading
  const color = userColor(org.id)

  const cell = (value: number | undefined, colorClass?: string) => {
    if (isLoading) return <Loader2 size={12} className="animate-spin text-gray-400 mx-auto" />
    if (value === undefined) return <span className="text-gray-300">—</span>
    return <span className={`font-semibold ${colorClass ?? 'text-gray-700'}`}>{value}</span>
  }

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-xs">{org.name.charAt(0).toUpperCase()}</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">{org.name}</span>
        </div>
      </td>

      <td className="px-4 py-3 text-center text-xs">{cell(projData?.pagination.totalRecords, 'text-blue-600')}</td>
      <td className="px-4 py-3 text-center text-xs">{cell(tasksData?.stats.total,      'text-gray-700')}</td>
      <td className="px-4 py-3 text-center text-xs">{cell(tasksData?.stats.completed,  'text-green-600')}</td>
      <td className="px-4 py-3 text-center text-xs">{cell(tasksData?.stats.inProgress, 'text-blue-500')}</td>
      <td className="px-4 py-3 text-center text-xs">{cell(tasksData?.stats.todo,       'text-gray-500')}</td>
      <td className="px-4 py-3 text-center text-xs">{cell(tasksData?.stats.overdue,    'text-red-500')}</td>
      <td className="px-4 py-3 text-center text-xs">{cell(tasksData?.stats.onHold,     'text-orange-500')}</td>

      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onView(org)}
          className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors"
          title="View in Admin"
        >
          <Eye size={15} />
        </button>
      </td>
    </tr>
  )
}

export default function OrgTable({ orgs, onView }: OrgTableProps) {
  if (orgs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
          <Building2 size={22} className="text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">No organizations found</p>
        <p className="text-xs text-gray-400">Create your first organization to get started</p>
      </div>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-gray-200 text-xs text-gray-600 font-semibold uppercase tracking-wide">
          <th className="px-4 py-3 text-left w-10 bg-[#ccfbf1]">S.No</th>
          <th className="px-4 py-3 text-left bg-[#ccfbf1]">Organization</th>
          <th className="px-4 py-3 text-center bg-[#ccfbf1]">Projects</th>
          <th className="px-4 py-3 text-center bg-[#ccfbf1]">Tasks</th>
          <th className="px-4 py-3 text-center bg-[#ccfbf1]">Completed</th>
          <th className="px-4 py-3 text-center bg-[#ccfbf1]">In Progress</th>
          <th className="px-4 py-3 text-center bg-[#ccfbf1]">To Do</th>
          <th className="px-4 py-3 text-center bg-[#ccfbf1]">Overdue</th>
          <th className="px-4 py-3 text-center bg-[#ccfbf1]">On Hold</th>
          <th className="px-4 py-3 w-12 bg-[#ccfbf1]" />
        </tr>
      </thead>
      <tbody>
        {orgs.map((org, idx) => (
          <OrgTableRow key={org.id} org={org} idx={idx} onView={onView} />
        ))}
      </tbody>
    </table>
  )
}
