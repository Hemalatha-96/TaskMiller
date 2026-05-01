import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Plus, Search, ChevronDown, LayoutList, LayoutGrid,
  ArrowLeft, ListTodo, Timer, AlertCircle, CheckCircle2, PauseCircle,
  Pencil, Trash2, Download,
} from 'lucide-react'
import { useProjects, useProject, useDeleteProjectMutation } from '../../../queries/projects.queries'
import { useOrgContext } from '../../../store/orgContext.store'
import { useDebounce } from '../../../hooks/useDebounce'
import { useAuth } from '../../../hooks/useAuth'
import { formatDate, projectStatusBadge, userColor } from '../../../lib/utils'
import { exportProjectTasksApi } from '../../../http/services/export.service'
import { downloadCsv } from '../../../lib/exportCsv'
import ProjectList from '../../../components/projects/ProjectList'
import ProjectCard from '../../../components/projects/ProjectCard'
import Pagination from '../../../components/ui/Pagination'
import { TableSkeleton, CardSkeleton, ProjectDetailSkeleton } from '../../../components/ui/Skeleton'
import ErrorMessage from '../../../components/common/ErrorMessage'
import S3Image from '../../../components/ui/S3Image'
import type { ApiError } from '../../../types/api.types'
import type { ProjectStatus } from '../../../types/project.types'

export const Route = createFileRoute('/_dashboard/projects/')({
  validateSearch: (search: Record<string, unknown>) => {
    const raw  = (search.view as string) ?? ''
    const slash = raw.indexOf('/')
    const mode  = slash === -1 ? raw : raw.slice(0, slash)
    const id    = slash > -1 ? raw.slice(slash + 1) || undefined : undefined
    const safe  = mode === 'card' ? 'card' : 'list'
    return {
      search: (search.search as string) || undefined,
      status: ((search.status as string) || undefined) as ProjectStatus | undefined,
      view:   (id ? `${safe}/${id}` : safe) as string,
      page:   Number(search.page)  > 1  ? Number(search.page)  : undefined,
      limit:  Number(search.limit) > 0 && Number(search.limit) !== 10 ? Number(search.limit) : undefined,
    }
  },
  component: ProjectsPage,
})

const cardColors = [
  'bg-teal-500','bg-gray-800','bg-blue-500','bg-violet-500',
  'bg-cyan-600','bg-indigo-500','bg-pink-500','bg-orange-500',
  'bg-green-600','bg-rose-500','bg-amber-500','bg-sky-500',
]
const statusLabel: Record<string, string> = {
  active: 'Active', on_hold: 'On Hold', completed: 'Completed',
}

function ProjectsPage() {
  const { isAdmin, isSuperAdmin } = useAuth()
  const { selectedOrg } = useOrgContext()
  const navigate = Route.useNavigate()
  const { search = '', status = '', view = 'list', page = 1, limit = 10 } = Route.useSearch()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setParams = (params: Record<string, any>) =>
    navigate({ search: (prev) => ({ ...prev, ...params }) as any })

  const slash      = view.indexOf('/')
  const viewMode   = (slash === -1 ? view : view.slice(0, slash)) as 'list' | 'card'
  const selectedId = slash === -1 ? undefined : view.slice(slash + 1) || undefined
  const isCard     = viewMode === 'card'

  useEffect(() => { setParams({ page: undefined }) }, [selectedOrg?.id])

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading, isFetching, error } = useProjects({
    search: debouncedSearch || undefined,
    status: status || undefined,
    orgId:  isSuperAdmin && selectedOrg ? selectedOrg.id : undefined,
    page,
    limit,
  })

  const { data: projectDetail, isLoading: isDetailLoading, error: detailError } = useProject(selectedId ?? '')
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProjectMutation()

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [membersPage,  setMembersPage]  = useState(1)
  const [membersLimit, setMembersLimit] = useState(10)
  const [exportingId,  setExportingId]  = useState<string | null>(null)

  const buildFullProjectRows = (data: Awaited<ReturnType<typeof exportProjectTasksApi>>) => {
    const taskRows = (data.tasks ?? []).flatMap((task) => [
      [
        'Task',
        task.title,
        task.description ?? '',
        task.status,
        task.priority,
        task.dueDate ?? '',
        (task.assigneeEmails ?? []).join(', '),
      ],
      ...(task.subtasks ?? []).map((sub) => [
        'Subtask',
        sub.title,
        sub.description ?? '',
        sub.status,
        sub.priority,
        sub.dueDate ?? '',
        (sub.assigneeEmails ?? []).join(', '),
      ]),
    ])
    return [
      ['Title', data.projectTitle],
      [],
      ['Type', 'Title', 'Description', 'Status', 'Priority', 'Due Date', 'Assignees'],
      ...taskRows,
    ]
  }

  const handleExportProject = async (projectId: string, title?: string) => {
    if (exportingId) return
    setExportingId(projectId)
    try {
      const data = await exportProjectTasksApi(projectId)
      if (!data || !data.tasks) {
        console.error('[Export] Unexpected response shape:', data)
        return
      }
      const filename = `project-${(title ?? data.projectTitle).toLowerCase().replace(/\s+/g, '-')}.csv`
      downloadCsv(buildFullProjectRows(data), filename)
    } catch (err) {
      console.error('[Export] Failed to export project:', err)
    } finally {
      setExportingId(null)
    }
  }

  const projects     = data?.projects    ?? []
  const pagination   = data?.pagination
  const totalRecords = pagination?.totalRecords ?? 0
  const totalPages   = pagination?.totalPages   ?? 1
  const activePage   = pagination?.currentPage  ?? page
  const activeLimit  = pagination?.limit        ?? limit
  const startEntry   = totalRecords === 0 ? 0 : (activePage - 1) * activeLimit + 1
  const endEntry     = Math.min(activePage * activeLimit, totalRecords)

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selectedId) {
    if (isDetailLoading) {
      return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <ProjectDetailSkeleton />
        </div>
      )
    }

    if (detailError || !projectDetail) {
      return (
        <div className="flex flex-col flex-1 min-h-0 gap-4 overflow-hidden">
          <button
            onClick={() => setParams({ view: viewMode })}
            className="flex-shrink-0 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={15} /> Back to Projects
          </button>
          <ErrorMessage message={(detailError as ApiError)?.message ?? 'Project not found'} />
        </div>
      )
    }

    const initials = projectDetail.title.slice(0, 2).toUpperCase()
    const bgColor  = cardColors[projectDetail.title.charCodeAt(0) % cardColors.length]
    const ts       = projectDetail.taskStats

    const stats = [
      { label: 'Total Tasks', value: ts.total,      iconBg: 'bg-purple-100', icon: <LayoutList   size={18} className="text-purple-500" /> },
      { label: 'Pending',     value: ts.pending,    iconBg: 'bg-blue-100',   icon: <ListTodo     size={18} className="text-blue-500"   /> },
      { label: 'In Progress', value: ts.inProgress, iconBg: 'bg-orange-100', icon: <Timer        size={18} className="text-orange-500" /> },
      { label: 'On Hold',     value: ts.onHold,     iconBg: 'bg-yellow-100', icon: <PauseCircle  size={18} className="text-yellow-500" /> },
      { label: 'Overdue',     value: ts.overdue,    iconBg: 'bg-red-100',    icon: <AlertCircle  size={18} className="text-red-500"    /> },
      { label: 'Completed',   value: ts.completed,  iconBg: 'bg-green-100',  icon: <CheckCircle2 size={18} className="text-green-500"  /> },
    ]

    const totalMembers     = projectDetail.members.length
    const totalMemberPages = Math.ceil(totalMembers / membersLimit) || 1
    const membersStart     = totalMembers === 0 ? 0 : (membersPage - 1) * membersLimit + 1
    const membersEnd       = Math.min(membersPage * membersLimit, totalMembers)
    const pagedMembers     = projectDetail.members.slice((membersPage - 1) * membersLimit, membersPage * membersLimit)

    return (
      <div className="flex flex-col flex-1 min-h-0 gap-4 overflow-hidden">

        <button
          onClick={() => setParams({ view: viewMode })}
          className="flex-shrink-0 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Projects
        </button>

        <div className="flex flex-1 gap-5 min-h-0">

          {/* ── Left panel ─────────────────────────────────────────────── */}
          <div className="flex flex-col flex-1 min-h-0 gap-4 overflow-hidden">

            {/* Header card */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
                  {projectDetail.logoUrl ? (
                    <S3Image storageKey={projectDetail.logoUrl} fallbackInitials={initials} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-lg">{initials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg font-bold text-gray-800 leading-tight">{projectDetail.title}</h2>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${projectStatusBadge[projectDetail.status] ?? 'bg-gray-50 text-gray-500'}`}>
                      {statusLabel[projectDetail.status] ?? projectDetail.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {projectDetail.description ?? <span className="text-gray-300 italic">No description provided</span>}
                  </p>
                </div>

                {/* Actions — admin only */}
                {isAdmin && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleExportProject(selectedId!, projectDetail.title)}
                      disabled={exportingId === selectedId}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-green-200 text-green-600 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Download size={13} />
                      {exportingId === selectedId ? 'Exporting...' : 'Export'}
                    </button>
                    <button
                      onClick={() => navigate({ to: '/projects/$projectId/edit', params: { projectId: selectedId! } })}
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
                          onClick={() => deleteProject(selectedId!, { onSuccess: () => setParams({ view: viewMode }) })}
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

              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1">Created By</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 ${userColor(projectDetail.creator.id)} rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
                      {projectDetail.creator.avatarUrl ? (
                        <S3Image storageKey={projectDetail.creator.avatarUrl} fallbackInitials={projectDetail.creator.name.charAt(0).toUpperCase()} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-xs font-semibold">{projectDetail.creator.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-700 truncate">{projectDetail.creator.name}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1">Created At</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(projectDetail.createdAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1">Updated At</p>
                  <p className="text-sm font-medium text-gray-700">{formatDate(projectDetail.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="flex flex-col flex-1 min-h-0 gap-3 overflow-hidden">
              <div className="flex flex-col flex-1 overflow-hidden bg-white rounded-xl border border-gray-100">
                <div className="flex-shrink-0 flex items-center px-5 py-3.5 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">
                    Members
                    <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {totalMembers}
                    </span>
                  </h3>
                </div>
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
                              {formatDate(projectDetail.createdAt)}
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
              </div>

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
            </div>

          </div>

          {/* ── Right panel — stats ─────────────────────────────────────── */}
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

  // ── List / card page ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white rounded-xl border border-gray-100">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            {isSuperAdmin && selectedOrg ? selectedOrg.name : 'All'}{' '}
            <span className="text-gray-400 font-normal ml-1">({totalRecords})</span>
          </h2>
          <div className="flex items-center gap-2">

            <div className="relative">
              <select
                value={status}
                onChange={(e) => setParams({ status: e.target.value || undefined, page: undefined })}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-gray-600 bg-white outline-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
              <input
                value={search}
                onChange={(e) => setParams({ search: e.target.value || undefined, page: undefined })}
                placeholder="Search by name"
                className="bg-transparent outline-none w-36 text-gray-700 placeholder-gray-400 text-xs"
              />
              <Search size={13} className={isFetching ? 'text-orange-400 animate-pulse' : 'text-gray-400'} />
            </div>

            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setParams({ view: 'list' })}
                className={`p-1.5 transition-colors cursor-pointer ${!isCard ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                title="List view"
              >
                <LayoutList size={14} />
              </button>
              <button
                onClick={() => setParams({ view: 'card' })}
                className={`p-1.5 transition-colors cursor-pointer ${isCard ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                title="Card view"
              >
                <LayoutGrid size={14} />
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={() => navigate({ to: '/projects/new' })}
                className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <Plus size={13} /> Add Project
              </button>
            )}

          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            isCard ? (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4,5,6,7,8].map((i) => <CardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="p-5"><TableSkeleton rows={8} cols={6} /></div>
            )
          ) : error ? (
            <div className="p-5">
              <ErrorMessage message={(error as ApiError)?.message ?? 'Failed to load projects'} />
            </div>
          ) : isCard ? (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {projects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={i}
                  onView={(id) => setParams({ view: `card/${id}` })}
                />
              ))}
            </div>
          ) : (
            <ProjectList
              projects={projects}
              onView={(id) => setParams({ view: `list/${id}` })}
              onExport={(id) => handleExportProject(id, projects.find((p) => p.id === id)?.title)}
              exportingId={exportingId}
            />
          )}
        </div>

      </div>

      {!isLoading && !error && totalPages > 0 && (
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
          onLimitChange={(val) => setParams({ limit: val !== 10 ? val : undefined, page: undefined })}
        />
      )}

    </div>
  )
}
