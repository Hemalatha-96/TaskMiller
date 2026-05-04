import { useEffect }                                     from 'react'
import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import {
  ArrowLeft, Eye,
  FolderKanban, ListTodo, CheckCircle2,
  Clock, Timer, AlertCircle, TrendingUp, PauseCircle, Hourglass,
} from 'lucide-react'
import { authStore }                          from '../../../store/auth.store'
import { useUser, useToggleUserStatusMutation } from '../../../queries/users.queries'
import { useAuth }                            from '../../../hooks/useAuth'
import { UserDetailSkeleton } from '../../../components/ui/Skeleton'
import Pagination from '../../../components/ui/Pagination'
import Tooltip from '../../../components/ui/Tooltip'
import ErrorMessage                           from '../../../components/common/ErrorMessage'
import StatusBadge                            from '../../../components/ui/StatusBadge'
import PriorityBadge                          from '../../../components/ui/PriorityBadge'
import { formatDate, roleAvatarColor, roleBadgeClasses, toAvatarShape , getInitials} from '../../../lib/utils'
import AvatarStack                               from '../../../components/ui/AvatarStack'
import S3Image                                   from '../../../components/ui/S3Image'
import type { TaskStatus, TaskPriority }      from '../../../types/task.types'
import type { UserProjectTask }               from '../../../types/user.types'
import type { ApiError }                      from '../../../types/api.types'

export const Route = createFileRoute('/_dashboard/users/$userId')({
  validateSearch: (search: Record<string, unknown>) => ({
    page:      Number(search.page)  > 1 ? Number(search.page)  : undefined,
    limit:     Number(search.limit) > 0 ? Number(search.limit) : undefined,
    projectId: typeof search.projectId === 'string' ? search.projectId : undefined,
  }),
  beforeLoad: () => {
    const role = authStore.state.user?.role
    if (role === 'developer') throw redirect({ to: '/dashboard', search: {} as any })
  },
  component: UserDetailPage,
})

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, iconBg,
}: {
  label:  string
  value:  number | string
  icon:   React.ReactNode
  iconBg: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-3 py-3 flex items-center gap-2 min-w-0">
      <div className={`w-9 h-9 ${iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 whitespace-pre-line leading-tight">{label}</p>
        <p className="text-lg font-bold text-gray-800 leading-tight">{value}</p>
      </div>
    </div>
  )
}

// ─── Tasks table ──────────────────────────────────────────────────────────────

function TasksTable({
  tasks,
  projectTitle,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: {
  tasks: UserProjectTask[]
  projectTitle: string
  page: number
  limit: number
  onPageChange: (p: number) => void
  onLimitChange: (l: number) => void
}) {
  const navigate = useNavigate()

  const totalRecords = tasks.length
  const totalPages   = Math.max(1, Math.ceil(totalRecords / limit))
  const start        = (page - 1) * limit
  const end          = page * limit
  const pagedTasks   = tasks.slice(start, end)

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      onPageChange(1)
    }
  }, [tasks, page, totalPages, onPageChange])

  return (
    <div className="bg-white rounded-xl border border-gray-100 flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-sm">Tasks List</h3>
        <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full font-semibold">
          {totalRecords}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-y-auto flex-1">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No tasks in {projectTitle}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[#ccfbf1]">
              <tr className="table-header text-xs text-gray-600 font-semibold">
                <th className="px-3 py-3 text-left">S No</th>
                <th className="px-3 py-3 text-left">Task Name</th>
                <th className="px-3 py-3 text-left">Due Date</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-left">Priority</th>
                <th className="px-3 py-3 text-left">Assignees</th>
                <th className="px-3 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pagedTasks.map((task, i) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 text-gray-400 text-xs">
                    {String(start + i + 1).padStart(2, '0')}
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-medium text-gray-700 max-w-[180px] truncate block">
                      {task.title}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {formatDate(task.dueDate)}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={task.status as TaskStatus} />
                  </td>
                  <td className="px-3 py-3">
                    <PriorityBadge priority={task.priority as TaskPriority} />
                  </td>
                  <td className="px-3 py-3">
                    {task.assignees && task.assignees.length > 0
                      ? <AvatarStack avatars={toAvatarShape(task.assignees)} max={3} size="sm" />
                      : <span className="text-xs text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-3 py-3">
                    <Tooltip label="View task">
                      <button
                        onClick={() => navigate({ to: '/tasks/$taskId', params: { taskId: task.id }, search: { tab: undefined } })}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                      </button>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination */}
      {totalRecords > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          startEntry={totalRecords === 0 ? 0 : start + 1}
          endEntry={Math.min(end, totalRecords)}
          limit={limit}
          hasPrevPage={page > 1}
          hasNextPage={page < totalPages}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-t border-gray-100"
        />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function UserDetailPage() {
  const { userId }  = Route.useParams()
  const { page = 1, limit = 5, projectId } = Route.useSearch()
  const navigate    = useNavigate()
  const { isAdmin, user: me } = useAuth()

  const setParams = (newParams: any) => {
    navigate({
      to:      Route.fullPath,
      params:  { userId },
      search:  (prev: any) => ({ ...prev, ...newParams }),
      replace: true,
    })
  }

  const { data: user, isLoading, error } = useUser(userId)
  const { mutate: toggleStatus, isPending: isToggling } = useToggleUserStatusMutation()

  const projects = user?.projects ?? []

  const selectedProject = projects.find((p) => p.id === projectId) ?? projects[0]

  if (isLoading) return <UserDetailSkeleton />

  if (error || !user) return (
    <div className="space-y-4">
      <button onClick={() => navigate({ to: '/users', search: {} as any })} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
        <ArrowLeft size={15} /> Back to Users
      </button>
      <ErrorMessage message={(error as ApiError)?.message ?? 'User not found'} />
    </div>
  )

  const s = user.stats
  const completionRate = s && s.totalTasks > 0
    ? Math.round((s.completed / s.totalTasks) * 100)
    : 0

  const stats = [
    { label: 'Projects',         value: s?.totalProjects ?? 0, iconBg: 'bg-pink-100',   icon: <FolderKanban size={16} className="text-pink-500"   /> },
    { label: 'Tasks',            value: s?.totalTasks    ?? 0, iconBg: 'bg-orange-100', icon: <ListTodo     size={16} className="text-orange-500" /> },
    { label: 'Completed',        value: s?.completed     ?? 0, iconBg: 'bg-green-100',  icon: <CheckCircle2 size={16} className="text-green-500"  /> },
    { label: 'Pending',          value: s?.pending       ?? 0, iconBg: 'bg-gray-100',   icon: <Hourglass    size={16} className="text-gray-500"   /> },
    { label: 'In Progress',      value: s?.inProgress    ?? 0, iconBg: 'bg-blue-100',   icon: <PauseCircle  size={16} className="text-blue-500"   /> },
    { label: 'On Hold',          value: s?.onHold        ?? 0, iconBg: 'bg-yellow-100', icon: <PauseCircle  size={16} className="text-yellow-500" /> },
    { label: 'Overdue',          value: s?.overdue       ?? 0, iconBg: 'bg-red-100',    icon: <AlertCircle  size={16} className="text-red-500"    /> },
    { label: 'On Time',          value: s?.onTime        ?? 0, iconBg: 'bg-teal-100',   icon: <Clock        size={16} className="text-teal-500"   /> },
    { label: 'Off Time',         value: s?.offTime       ?? 0, iconBg: 'bg-purple-100', icon: <Timer        size={16} className="text-purple-500" /> },
    { label: 'Completion\nRate', value: `${completionRate}%`,  iconBg: 'bg-indigo-100', icon: <TrendingUp   size={16} className="text-indigo-500" /> },
  ]

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 pb-6">

      {/* Back */}
      <button
        onClick={() => navigate({ to: '/users', search: {} as any })}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
      >
        <ArrowLeft size={15} /> Back to Users
      </button>

      {/* User header card */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${roleAvatarColor[user.role] ?? 'bg-gray-400'} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
              {user.avatarUrl ? (
                <S3Image storageKey={user.avatarUrl} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-lg">{getInitials(user.name)}</span>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800 leading-tight">{user.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${roleBadgeClasses[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                  {user.role}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${user.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                  {user.status === 'active' ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-400">{user.email}</span>
              </div>
            </div>
          </div>
          {isAdmin && user.id !== me?.id && (
            <button
              onClick={() => toggleStatus({ id: user.id, status: user.status === 'active' ? 'inactive' : 'active' })}
              disabled={isToggling}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 flex-shrink-0 ${
                user.status === 'active'
                  ? 'border-red-200 text-red-500 hover:bg-red-50'
                  : 'border-green-200 text-green-600 hover:bg-green-50'
              }`}
            >
              {isToggling ? 'Updating...' : user.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-10 gap-2">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Projects + Tasks */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
          No projects assigned yet.
        </div>
      ) : (
        <div className="flex gap-4 h-[460px]">

          {/* Left: project list */}
          <div className="w-60 flex-shrink-0 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">
                Projects
                <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
                  {projects.length}
                </span>
              </h3>
            </div>
            <div className="overflow-y-auto flex-1">
              {projects.map((p) => {
                const isSelected = (projectId ?? projects[0]?.id) === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setParams({ projectId: p.id, page: undefined })
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-2 transition-colors border-b border-gray-50 last:border-0 ${
                      isSelected ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-sm font-medium truncate">{p.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {p.tasks.length}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right: tasks table */}
          {selectedProject && (
            <TasksTable
              tasks={selectedProject.tasks}
              projectTitle={selectedProject.title}
              page={page}
              limit={limit}
              onPageChange={(p) => setParams({ page: p > 1 ? p : undefined })}
              onLimitChange={(l) => setParams({ limit: l !== 5 ? l : undefined, page: undefined })}
            />
          )}

        </div>
      )}

    </div>
  )
}
