import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronLeft, CheckSquare, Clock, AlertTriangle, CircleDot, FolderKanban } from 'lucide-react'
import { useUser } from '../../../lib/queries/users.queries'
import { useTasks } from '../../../lib/queries/tasks.queries'
import { useProjects } from '../../../lib/queries/projects.queries'
import { Avatar } from '../../../components/ui/avatar'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { ErrorMessage } from '../../../components/common/ErrorMessage'
import { formatDate } from '../../../utils/date'
import { getUserStatusColor } from '../../../utils/status'
import { cn } from '../../../utils/cn'
import type { Task } from '../../../types/task.types'
import type { Project } from '../../../types/project.types'

export const Route = createFileRoute('/_dashboard/users/$userId')({
  component: UserDetailPage,
})

const STATUS_META: Record<string, { label: string; icon: typeof CheckSquare; color: string; bg: string }> = {
  completed:   { label: 'Completed',   icon: CheckSquare,   color: 'text-green-600',  bg: 'bg-green-50' },
  in_progress: { label: 'In Progress', icon: CircleDot,     color: 'text-orange-600', bg: 'bg-orange-50' },
  to_do:       { label: 'To Do',       icon: Clock,         color: 'text-blue-600',   bg: 'bg-blue-50' },
  on_hold:     { label: 'On Hold',     icon: Clock,         color: 'text-gray-500',   bg: 'bg-gray-100' },
  overdue:     { label: 'Overdue',     icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50' },
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high:   'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-gray-100 text-gray-600',
}

const PROJECT_STATUS_COLOR: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  on_hold:   'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
}

function TaskRow({ task }: { task: Task }) {
  const meta = STATUS_META[task.status] ?? STATUS_META.to_do
  const Icon = meta.icon
  return (
    <Link
      to="/tasks/$taskId"
      params={{ taskId: task.id }}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-b-0"
    >
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', meta.bg)}>
        <Icon className={cn('w-3.5 h-3.5', meta.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 truncate">{task.name}</p>
        {task.projectName && (
          <p className="text-xs text-gray-400 truncate">{task.projectName}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {task.priority && (
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', PRIORITY_COLOR[task.priority] ?? PRIORITY_COLOR.medium)}>
            {task.priority}
          </span>
        )}
        <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(task.dueDate)}</span>
      </div>
    </Link>
  )
}

function ProjectRow({ project }: { project: Project }) {
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-b-0"
    >
      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 truncate">{project.title}</p>
        {project.orgName && (
          <p className="text-xs text-gray-400 truncate">{project.orgName}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', PROJECT_STATUS_COLOR[project.status] ?? PROJECT_STATUS_COLOR.active)}>
          {project.status.replace('_', ' ')}
        </span>
      </div>
    </Link>
  )
}

function UserDetailPage() {
  const { userId } = Route.useParams()
  const { data: user, isLoading, error } = useUser(userId)
  const { data: tasksData,    isLoading: tasksLoading }    = useTasks({ assigneeId: userId, limit: 50 })
  const { data: projectsData, isLoading: projectsLoading } = useProjects({ memberId: userId, limit: 50 })
  const [taskSearch, setTaskSearch] = useState('')

  if (isLoading) return <LoadingSpinner />
  if (error || !user) return <ErrorMessage message="User not found." />

  const tasks    = tasksData?.data    ?? []
  const projects = projectsData?.data ?? []

  const filteredTasks = taskSearch.trim()
    ? tasks.filter((t) =>
        t.name.toLowerCase().includes(taskSearch.toLowerCase()) ||
        (t.projectName ?? '').toLowerCase().includes(taskSearch.toLowerCase()),
      )
    : tasks

  return (
    <div className="h-full overflow-y-auto pr-1">
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/users" search={{ q: '', status: '', page: 1 }} className="flex items-center gap-1 hover:text-[#F4622A] transition">
          <ChevronLeft className="w-4 h-4" />Users
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{user.name}</span>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-8">
        <div className="flex items-start gap-5 mb-6">
          <Avatar name={user.name} size="lg" />
          <div>
            <h1 className="text-base font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500 capitalize">{user.role}</p>
            <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1', getUserStatusColor(user.status))}>
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {[
            { label: 'Email',        value: user.email },
            { label: 'Phone',        value: user.phone || '—' },
            { label: 'Department',   value: user.department ?? '—' },
            { label: 'Member Since', value: formatDate(user.createdAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="text-sm font-medium text-gray-800">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Projects + Tasks side by side */}
      <div className="grid grid-cols-2 gap-6">
        {/* Projects Section */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-800">Projects</h2>
            <span className="text-xs text-gray-400">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
          </div>
          {projectsLoading ? (
            <div className="py-8"><LoadingSpinner /></div>
          ) : projects.length === 0 ? (
            <p className="px-4 py-8 text-xs text-gray-400 text-center">No projects found for this user.</p>
          ) : (
            <div>{projects.map((p) => <ProjectRow key={p.id} project={p} />)}</div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2 justify-between">
            <h2 className="text-xs font-semibold text-gray-800">Assigned Tasks</h2>
            <div className="flex items-center gap-2">
              <input
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search by task..."
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-[#F4622A] focus:ring-1 focus:ring-[#F4622A]/20"
              />
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          {tasksLoading ? (
            <div className="py-8"><LoadingSpinner /></div>
          ) : filteredTasks.length === 0 ? (
            <p className="px-4 py-8 text-xs text-gray-400 text-center">
              {taskSearch.trim() ? 'No tasks match your search.' : 'No tasks assigned to this user.'}
            </p>
          ) : (
            <div>{filteredTasks.map((t) => <TaskRow key={t.id} task={t} />)}</div>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
