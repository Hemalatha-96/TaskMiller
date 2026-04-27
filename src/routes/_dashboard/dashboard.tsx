import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Plus, Eye } from 'lucide-react'
import { useTasks } from '../../lib/queries/tasks.queries'
import { useProjects } from '../../lib/queries/projects.queries'
import { TaskPriorityBadge } from '../../components/tasks/TaskPriorityBadge'
import { AvatarGroup } from '../../components/ui/avatar'
import { Pagination } from '../../components/ui/Pagination'
import { getEffectiveStatus, getTaskStatusColor } from '../../utils/status'
import { TASK_STATUS_LABELS, TASK_PRIORITY_OPTIONS } from '../../constants/enums'
import { formatDate, isOverdue } from '../../utils/date'
import { TaskTableSkeleton } from '../../components/common/TaskTableSkeleton'
import { useDebounce } from '../../hooks/useDebounce'
import { cn } from '../../utils/cn'
import { useAuth } from '../../hooks/useAuth'
import { useOrgStore } from '../../store/org.store'

export const Route = createFileRoute('/_dashboard/dashboard')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || undefined,
    status: (search.status as string) || undefined,
    projectId: (search.projectId as string) || undefined,
    priority: (search.priority as string) || undefined,
    page: Number(search.page) > 1 ? Number(search.page) : undefined,
  }),
  component: DashboardPage,
})

const PAGE_SIZE = 20

function DashboardPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { orgId, isSuperAdmin, isAdmin } = useAuth()
  const { activeOrgId } = useOrgStore()

  const effectiveOrgId = isSuperAdmin ? (activeOrgId ?? undefined) : (orgId ?? undefined)
  const debouncedQ = useDebounce(search.q || '', 400)

  const { data: tasksData, isLoading } = useTasks({
    search: debouncedQ,
    status: search.status,
    projectId: search.projectId,
    priority: search.priority,
    limit: PAGE_SIZE,
    page: search.page ?? 1,
    orgId: effectiveOrgId,
  })
  const { data: projectsData } = useProjects({ limit: 100, orgId: effectiveOrgId })
  // Absolute (unfiltered) counts for accurate stat cards
  const { data: absoluteData } = useTasks({ limit: 1, orgId: effectiveOrgId })
  const { data: todoData } = useTasks({ status: 'to_do', limit: 1, orgId: effectiveOrgId })
  const { data: inProgressData } = useTasks({ status: 'in_progress', limit: 1, orgId: effectiveOrgId })
  const { data: onHoldData } = useTasks({ status: 'on_hold', limit: 1, orgId: effectiveOrgId })
  const { data: completedData } = useTasks({ status: 'completed', limit: 1, orgId: effectiveOrgId })

  const projects = projectsData?.data ?? []
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.title]))
  const tasks = tasksData?.data ?? []
  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'completed').length

  // Stats always use absolute totals, independent of table filters
  const absoluteTotal = absoluteData?.total ?? 0
  const todoCount = todoData?.total ?? 0
  const inProgressCount = inProgressData?.total ?? 0
  const onHoldCount = onHoldData?.total ?? 0
  const completedCount = completedData?.total ?? 0
  const completionRate = absoluteTotal > 0 ? Math.round((completedCount / absoluteTotal) * 100) : 0

  const setFilter = (updates: Record<string, string | number | undefined>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...Object.fromEntries(Object.entries(updates).map(([k, v]) => [k, v === '' ? undefined : v])),
        page: undefined,
      }),
      replace: true,
    })
  }

  const setPage = (page: number) => {
    navigate({ search: (prev) => ({ ...prev, page: page > 1 ? page : undefined }), replace: true })
  }

  const STAT_CARDS = [
    { label: 'Projects', value: String(projectsData?.total ?? 0), color: 'bg-blue-500', light: 'bg-blue-50' },
    { label: 'Total Tasks', value: String(absoluteTotal), color: 'bg-gray-500', light: 'bg-gray-50' },
    { label: 'Todo', value: String(todoCount), color: 'bg-cyan-500', light: 'bg-cyan-50' },
    { label: 'In Progress', value: String(inProgressCount), color: 'bg-purple-500', light: 'bg-purple-50' },
    { label: 'On Hold', value: String(onHoldCount), color: 'bg-yellow-500', light: 'bg-yellow-50' },
    { label: 'Overdue', value: String(overdueCount), color: 'bg-red-500', light: 'bg-red-50' },
    { label: 'Completed', value: String(completedCount), color: 'bg-teal-500', light: 'bg-teal-50' },
    { label: 'Completion Rate', value: `${completionRate}%`, color: 'bg-indigo-500', light: 'bg-indigo-50' },
  ]

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      <div className="flex-shrink-0 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Overview of all your projects and tasks</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Link
                to="/tasks"
                search={{ q: undefined, status: undefined, projectId: undefined, priority: undefined, page: undefined }}
                className="inline-flex items-center gap-2 border border-[#F4622A] text-[#F4622A] px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-50 transition"
              >
                <Plus className="w-4 h-4" />Add Task
              </Link>
              <Link
                to="/projects"
                search={{ q: undefined, status: undefined, page: undefined }}
                className="inline-flex items-center gap-2 bg-[#F4622A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#E05520] transition"
              >
                <Plus className="w-4 h-4" />Add Project
              </Link>
              {isSuperAdmin && (
                <Link
                  to="/orgs"
                  search={{ q: '' }}
                  className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
                >
                  <Plus className="w-4 h-4" />Add Org
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {STAT_CARDS.map((card) => (
            <div key={card.label} className={`${card.light} rounded-lg p-2.5 flex flex-col gap-0.5`}>
              <span className="text-sm font-bold text-gray-900">{card.value}</span>
              <span className="text-xs font-medium text-gray-500">{card.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Tasks List</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search.q || ''}
              onChange={(e) => setFilter({ q: e.target.value })}
              placeholder="Search by task..."
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-[#F4622A] focus:ring-1 focus:ring-[#F4622A]/20"
            />
            <select
              value={search.status || ''}
              onChange={(e) => setFilter({ status: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:border-[#F4622A] bg-white"
            >
              <option value="">Select Status</option>
              <option value="to_do">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={search.projectId || ''}
              onChange={(e) => setFilter({ projectId: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:border-[#F4622A] bg-white"
            >
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <select
              value={search.priority || ''}
              onChange={(e) => setFilter({ priority: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:border-[#F4622A] bg-white"
            >
              <option value="">All Priorities</option>
              {TASK_PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <TaskTableSkeleton rows={8} includeCreatedBy={false} />
        ) : (
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 z-10 bg-white border-b border-gray-50">
                  {['S.No', 'Project', 'Task Name', 'Assigned User', 'Due Date', 'Status', 'Priority', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No tasks found</td></tr>
                ) : tasks.map((task, i) => (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{String(((search.page ?? 1) - 1) * PAGE_SIZE + i + 1).padStart(2, '0')}</td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-600 whitespace-nowrap">{projectMap[task.projectId] ?? task.projectName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Link to="/tasks/$taskId" params={{ taskId: task.id }} className="font-medium text-gray-800 hover:text-[#F4622A] transition-colors whitespace-nowrap">
                        {task.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <AvatarGroup names={task.assignees.map((a) => a.name)} max={3} size="xs" />
                    </td>
                    <td className={cn('px-4 py-3 text-xs whitespace-nowrap', isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-500 font-medium' : 'text-gray-500')}>
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const effectiveStatus = getEffectiveStatus(task.status, task.dueDate)
                        return (
                          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getTaskStatusColor(effectiveStatus))}>
                            {TASK_STATUS_LABELS[effectiveStatus]}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3"><TaskPriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-3">
                      <Link to="/tasks/$taskId" params={{ taskId: task.id }} className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition inline-flex" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex-shrink-0">
          <Pagination
            page={search.page ?? 1}
            totalPages={tasksData?.totalPages ?? 1}
            total={tasksData?.total ?? 0}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      </div>
    </div>
  )
}
