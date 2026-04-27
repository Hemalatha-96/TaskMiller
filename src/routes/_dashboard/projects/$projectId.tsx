import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft, Pencil, Trash2,
  ListTodo, Timer, AlertCircle, CheckCircle2, LayoutList, PauseCircle,
} from 'lucide-react'
import { useProject, useDeleteProjectMutation } from '../../../queries/projects.queries'
import { useAuth } from '../../../hooks/useAuth'
import { ProjectDetailSkeleton } from '../../../components/ui/Skeleton'
import ErrorMessage from '../../../components/common/ErrorMessage'
import S3Image from '../../../components/ui/S3Image'
import Pagination from '../../../components/ui/Pagination'
import { userColor, formatDate, projectStatusBadge } from '../../../lib/utils'
import type { ApiError } from '../../../types/api.types'

export const Route = createFileRoute('/_dashboard/projects/$projectId')({
  component: ProjectViewPage,
})

const cardColors = [
  'bg-teal-500',   'bg-gray-800',  'bg-blue-500',
  'bg-violet-500', 'bg-cyan-600',  'bg-indigo-500',
  'bg-pink-500',   'bg-orange-500','bg-green-600',
]


const statusLabel: Record<string, string> = {
  active:    'Active',
  on_hold:   'On Hold',
  completed: 'Completed',
}

function ProjectViewPage() {
  const { projectId } = Route.useParams()
  const navigate      = useNavigate()
  const { isAdmin }   = useAuth()

  const { data: project, isLoading, error } = useProject(projectId)
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProjectMutation()


  const [confirmDelete, setConfirmDelete] = useState(false)
  const [membersPage,  setMembersPage]  = useState(1)
  const [membersLimit, setMembersLimit] = useState(10)

  const handleDelete = () => {
    deleteProject(projectId, {
      onSuccess: () => navigate({ to: '/projects', search: {} as any }),
    })
  }

  if (isLoading) return <ProjectDetailSkeleton />

  if (error || !project) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate({ to: '/projects', search: {} as any })} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={15} /> Back to Projects
        </button>
        <ErrorMessage message={(error as ApiError)?.message ?? 'Project not found'} />
      </div>
    )
  }

  const initials = project.title.slice(0, 2).toUpperCase()
  const bgColor  = cardColors[project.title.charCodeAt(0) % cardColors.length]

  const ts = project.taskStats
  const stats = [
    { label: 'Total Tasks',  value: ts.total,      iconBg: 'bg-purple-100', icon: <LayoutList   size={18} className="text-purple-500" /> },
    { label: 'Pending',      value: ts.pending,    iconBg: 'bg-blue-100',   icon: <ListTodo     size={18} className="text-blue-500"   /> },
    { label: 'In Progress',  value: ts.inProgress, iconBg: 'bg-orange-100', icon: <Timer        size={18} className="text-orange-500" /> },
    { label: 'On Hold',      value: ts.onHold,     iconBg: 'bg-yellow-100', icon: <PauseCircle  size={18} className="text-yellow-500" /> },
    { label: 'Overdue',      value: ts.overdue,    iconBg: 'bg-red-100',    icon: <AlertCircle  size={18} className="text-red-500"    /> },
    { label: 'Completed',    value: ts.completed,  iconBg: 'bg-green-100',  icon: <CheckCircle2 size={18} className="text-green-500"  /> },
  ]

  const totalMembers    = project.members.length
  const totalMemberPages = Math.ceil(totalMembers / membersLimit) || 1
  const membersStart    = totalMembers === 0 ? 0 : (membersPage - 1) * membersLimit + 1
  const membersEnd      = Math.min(membersPage * membersLimit, totalMembers)
  const pagedMembers    = project.members.slice((membersPage - 1) * membersLimit, membersPage * membersLimit)

  return (
    <div className="flex flex-col flex-1 gap-4 overflow-hidden">

      {/* Back */}
      <button
        onClick={() => navigate({ to: '/projects', search: {} as any })}
        className="flex-shrink-0 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Projects
      </button>

      <div className="flex flex-1 gap-5 min-h-0">

        {/* ── Left panel ────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-h-0 gap-4 overflow-hidden">

          {/* Header card */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
                  {project.logoUrl ? (
                    <S3Image
                      storageKey={project.logoUrl}
                      fallbackInitials={initials}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">{initials}</span>
                  )}
                </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg font-bold text-gray-800 leading-tight">{project.title}</h2>
                  {project.status && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${projectStatusBadge[project.status] ?? 'bg-gray-50 text-gray-500'}`}>
                      {statusLabel[project.status] ?? project.status}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {project.description ?? <span className="text-gray-300 italic">No description provided</span>}
                </p>
              </div>

              {/* Actions */}
              {isAdmin && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate({ to: '/projects/$projectId/edit', params: { projectId } })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  {confirmDelete ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-2.5 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-2.5 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
                      >
                        {isDeleting ? 'Deleting...' : 'Confirm'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Created By / Created At / Updated At */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Created By</p>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 ${userColor(project.creator.id)} rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
                    {project.creator.avatarUrl ? (
                      <S3Image storageKey={project.creator.avatarUrl} fallbackInitials={project.creator.name.charAt(0).toUpperCase()} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-semibold">{project.creator.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700 truncate">{project.creator.name}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Created At</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(project.createdAt)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Updated At</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(project.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Members section: card + pagination footer */}
          <div className="flex flex-col flex-1 min-h-0 gap-3 overflow-hidden">

            {/* Members card */}
            <div className="flex flex-col flex-1 overflow-hidden bg-white rounded-xl border border-gray-100">

              {/* Card header */}
              <div className="flex-shrink-0 flex items-center px-5 py-3.5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">
                  Members
                  <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {totalMembers}
                  </span>
                </h3>
              </div>

              {/* Scrollable table */}
              <div className="flex-1 overflow-y-auto">
                {totalMembers === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <p className="text-sm">No members assigned</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-20">
                      <tr className="text-xs text-gray-600 font-semibold">
                        <th className="px-5 py-3 text-left bg-[#ccfbf1]">#</th>
                        <th className="px-5 py-3 text-left bg-[#ccfbf1]">Name</th>
                        <th className="px-5 py-3 text-left bg-[#ccfbf1]">Date</th>
                        <th className="px-5 py-3 text-left bg-[#ccfbf1]">Tasks Assigned</th>
                        <th className="px-5 py-3 text-left bg-[#ccfbf1]">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pagedMembers.map((m, i) => (
                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 text-gray-400 text-xs">
                            {String((membersPage - 1) * membersLimit + i + 1).padStart(2, '0')}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full ${userColor(m.id)} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
                                {m.avatarUrl ? (
                                  <S3Image storageKey={m.avatarUrl} fallbackInitials={m.name.charAt(0).toUpperCase()} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-white text-xs font-semibold">{m.name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="font-medium text-gray-700 whitespace-nowrap">{m.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {formatDate(project.createdAt)}
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold">
                              {m.totalTasksAssigned}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-xs">{m.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>{/* end members card */}

            {/* Pagination footer */}
            {totalMembers > 0 && (
              <Pagination
                page={membersPage}
                totalPages={totalMemberPages}
                totalRecords={totalMembers}
                startEntry={membersStart}
                endEntry={membersEnd}
                limit={membersLimit}
                hasPrevPage={membersPage > 1}
                hasNextPage={membersPage < totalMemberPages}
                onPageChange={setMembersPage}
                onLimitChange={(l) => { setMembersLimit(l); setMembersPage(1) }}
              />
            )}

          </div>{/* end members section */}

        </div>{/* end left panel */}

        {/* ── Right panel — unified stats card ──────────────────────────── */}
        <div className="w-64 flex-shrink-0 overflow-y-auto">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Statistics</p>
            <div className="space-y-3">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">{s.label}</p>
                    <p className="text-xl font-bold text-gray-800 leading-tight">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
