import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Eye } from 'lucide-react'
import { useTasks } from '../../queries/tasks.queries'
import { useProjects } from '../../queries/projects.queries'
import { setSelectedOrg } from '../../store/orgContext.store'
import { userColor, getInitials } from '../../lib/utils'
import type { Organization } from '../../types/org.types'

function OrgStatsRow({ org, idx }: { org: Organization; idx: number }) {
  const navigate = useNavigate()

  const { data: tasksData,    isLoading: loadingTasks    } = useTasks({ orgId: org.id, limit: 1 })
  const { data: projectsData, isLoading: loadingProjects } = useProjects({ orgId: org.id, limit: 1 })

  const stats      = tasksData?.stats
  const total      = stats?.total      ?? 0
  const completed  = stats?.completed  ?? 0
  const inProgress = stats?.inProgress ?? 0
  const todo       = stats?.todo       ?? 0
  const onHold     = stats?.onHold     ?? 0
  const overdue    = stats?.overdue    ?? 0
  const projects   = projectsData?.pagination?.totalRecords ?? 0
  const rate       = total > 0 ? Math.round((completed / total) * 100) : 0
  const isLoading  = loadingTasks || loadingProjects
  const color      = userColor(org.id)

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedOrg(org)
    navigate({ to: '/admin/dashboard', search: {} as any })
  }

  return (
    <tr className="border-b border-gray-50 hover:bg-teal-50/40 transition-colors cursor-pointer group">
      <td className="px-3 py-2.5 text-gray-400 text-xs">{idx}</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md ${color} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-[10px]">{getInitials(org.name)}</span>
          </div>
          <span className="font-medium text-gray-800 text-xs">{org.name}</span>
        </div>
      </td>
      {isLoading ? (
        <td colSpan={8} className="px-3 py-2.5">
          <div className="h-3 bg-gray-100 rounded animate-pulse w-40" />
        </td>
      ) : (
        <>
          <td className="px-3 py-2.5 text-center text-xs font-medium text-gray-600">{projects}</td>
          <td className="px-3 py-2.5 text-center text-xs font-medium text-gray-600">{total}</td>
          <td className="px-3 py-2.5 text-center">
            <span className="text-xs font-semibold text-green-600">{completed}</span>
          </td>
          <td className="px-3 py-2.5 text-center">
            <span className="text-xs font-semibold text-blue-600">{inProgress}</span>
          </td>
          <td className="px-3 py-2.5 text-center">
            <span className="text-xs font-medium text-gray-500">{todo}</span>
          </td>
          <td className="px-3 py-2.5 text-center">
            <span className="text-xs font-medium text-yellow-600">{onHold}</span>
          </td>
          <td className="px-3 py-2.5 text-center">
            <span className="text-xs font-semibold text-red-500">{overdue}</span>
          </td>
          <td className="px-3 py-2.5 text-center">
            <span className={`text-xs font-bold ${rate >= 75 ? 'text-green-600' : rate >= 40 ? 'text-orange-500' : 'text-red-500'}`}>
              {rate}%
            </span>
          </td>
        </>
      )}
      <td className="px-3 py-2.5 text-center">
        <div className="relative group/tip inline-flex">
          <button
            onClick={handleView}
            className="p-1 rounded-lg border border-gray-200 hover:bg-teal-50 hover:border-teal-300 text-gray-400 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <Eye size={12} />
          </button>
          <span className="pointer-events-none absolute -top-7 right-0 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover/tip:opacity-100 transition-opacity z-[999]">
            View in Admin
          </span>
        </div>
      </td>
    </tr>
  )
}

interface OrgStatsTableProps {
  orgs:       Organization[]
  startEntry: number
}

export default function OrgStatsTable({ orgs, startEntry }: OrgStatsTableProps) {
  if (!orgs.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-medium text-gray-500">No organizations found</p>
    </div>
  )

  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-gray-200 text-[10px] text-gray-600 font-semibold uppercase tracking-wide">
          <th className="px-3 py-2.5 text-left w-8 bg-[#ccfbf1]">S.no</th>
          <th className="px-3 py-2.5 text-left bg-[#ccfbf1]">Organization</th>
          <th className="px-3 py-2.5 text-center bg-[#ccfbf1]">Projects</th>
          <th className="px-3 py-2.5 text-center bg-[#ccfbf1]">Tasks</th>
          <th className="px-3 py-2.5 text-center bg-[#ccfbf1]">Done</th>
          <th className="px-3 py-2.5 text-center bg-[#ccfbf1]">In Progress</th>
          <th className="px-3 py-2.5 text-center bg-[#ccfbf1]">To Do</th>
          <th className="px-3 py-2.5 text-center bg-[#ccfbf1]">On Hold</th>
          <th className="px-3 py-2.5 text-center bg-[#ccfbf1]">Overdue</th>
          <th className="px-3 py-2.5 text-center bg-[#ccfbf1]">Completion Rate</th>
          <th className="px-3 py-2.5 text-center bg-[#ccfbf1]">Actions</th>
        </tr>
      </thead>
      <tbody>
        {orgs.map((org, idx) => (
          <OrgStatsRow key={org.id} org={org} idx={startEntry + idx} />
        ))}
      </tbody>
    </table>
  )
}
