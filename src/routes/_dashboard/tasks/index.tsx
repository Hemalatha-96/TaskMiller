import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { useTasks, useDeleteTask, useUpdateTaskStatus, useUpdateTask } from '../../../lib/queries/tasks.queries'
import { useProjects } from '../../../lib/queries/projects.queries'
import { TaskForm } from '../../../components/tasks/TaskForm'
import { ConfirmDeleteModal } from '../../../components/common/ConfirmDeleteModal'
import { SearchDropdown } from '../../../components/common/SearchDropdown'
import { Modal } from '../../../components/ui/modal'
import { Pagination } from '../../../components/ui/Pagination'
import { AvatarGroup } from '../../../components/ui/avatar'
import { getTaskStatusColor, getAllowedStatuses, getEffectiveStatus } from '../../../utils/status'
import { TASK_STATUS_LABELS, TASK_PRIORITY_OPTIONS } from '../../../constants/enums'
import { formatDate, isOverdue } from '../../../utils/date'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { useModal } from '../../../hooks/useModal'
import { useDebounce } from '../../../hooks/useDebounce'
import { cn } from '../../../utils/cn'
import type { Task, TaskPriority } from '../../../types/task.types'
import { useAuth } from '../../../hooks/useAuth'
import { useOrgStore } from '../../../store/org.store'

export const Route = createFileRoute('/_dashboard/tasks/')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || '',
    status: (search.status as string) || '',
    projectId: (search.projectId as string) || '',
    priority: (search.priority as string) || '',
    page: Number(search.page) || 1,
  }),
  component: TasksPage,
})

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

function InlineStatusDropdown({ task }: { task: Task }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const updateStatus = useUpdateTaskStatus()
  useClickOutside(ref, () => setOpen(false))

  const effectiveStatus = getEffectiveStatus(task.status, task.dueDate)
  const allowedStatuses = getAllowedStatuses(effectiveStatus)
  const canChange = allowedStatuses.length > 0

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => canChange && setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-opacity',
          getTaskStatusColor(effectiveStatus),
          !canChange ? 'cursor-default' : '',
          updateStatus.isPending ? 'opacity-60 pointer-events-none' : '',
        )}
      >
        {TASK_STATUS_LABELS[effectiveStatus]}
        {canChange && <ChevronDown className="w-3 h-3" />}
      </button>
      {open && canChange && (
        <div className="absolute z-30 mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[130px] py-1">
          {allowedStatuses.map((status) => (
            <button
              key={status}
              onClick={() => { updateStatus.mutate({ id: task.id, status }); setOpen(false) }}
              className={cn('w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors', 'text-gray-700')}
            >
              {TASK_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function InlinePriorityDropdown({ task }: { task: Task }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const updateTask = useUpdateTask()
  useClickOutside(ref, () => setOpen(false))

  const priorityColors: Record<TaskPriority, string> = {
    low: 'bg-blue-50 text-blue-600',
    medium: 'bg-yellow-50 text-yellow-600',
    high: 'bg-orange-50 text-orange-600',
    urgent: 'bg-red-50 text-red-600',
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-opacity', priorityColors[task.priority], updateTask.isPending ? 'opacity-60 pointer-events-none' : '')}
      >
        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[110px] py-1">
          {TASK_PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { updateTask.mutate({ id: task.id, data: { priority: opt.value as TaskPriority } }); setOpen(false) }}
              className={cn('w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors', task.priority === opt.value ? 'font-semibold text-[#F4622A]' : 'text-gray-700')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const PAGE_SIZE = 20

function TasksPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const { orgId, isSuperAdmin, isAdmin } = useAuth()
  const { activeOrgId } = useOrgStore()
  const effectiveOrgId = isSuperAdmin ? (activeOrgId ?? undefined) : (orgId ?? undefined)

  const debouncedQ = useDebounce(search.q, 400)

  const { data, isLoading } = useTasks({
    search: debouncedQ,
    status: search.status || undefined,
    projectId: search.projectId || undefined,
    priority: search.priority || undefined,
    page: search.page,
    limit: PAGE_SIZE,
    orgId: effectiveOrgId,
  })
  const { data: projectsData } = useProjects({ limit: 100, orgId: effectiveOrgId })
  const { data: todoData } = useTasks({ status: 'to_do', limit: 1, orgId: effectiveOrgId })
  const { data: inProgressData } = useTasks({ status: 'in_progress', limit: 1, orgId: effectiveOrgId })
  const { data: completedData } = useTasks({ status: 'completed', limit: 1, orgId: effectiveOrgId })
  const deleteTask = useDeleteTask()
  const [deleteError, setDeleteError] = useState('')
  const createModal = useModal()
  const editModal = useModal<Task>()
  const deleteModal = useModal<Task>()

  const tasks = data?.data ?? []
  const projects = projectsData?.data ?? []
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.title]))
  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'completed').length

  const setFilter = (updates: Partial<typeof search>) => {
    navigate({ search: (prev) => ({ ...prev, ...updates, page: 1 }), replace: true })
  }

  const setPage = (page: number) => {
    navigate({ search: (prev) => ({ ...prev, page }), replace: true })
  }

  const STATS = [
    { label: 'Total', value: data?.total ?? 0, color: 'bg-blue-50 text-blue-600' },
    { label: 'Todo', value: todoData?.total ?? 0, color: 'bg-gray-50 text-gray-600' },
    { label: 'In Progress', value: inProgressData?.total ?? 0, color: 'bg-purple-50 text-purple-600' },
    { label: 'Overdue', value: overdueCount, color: 'bg-red-50 text-red-600' },
    { label: 'Completed', value: completedData?.total ?? 0, color: 'bg-green-50 text-green-600' },
  ]

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      <div className="flex-shrink-0 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-500">All tasks across your projects</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => createModal.open()}
              className="inline-flex items-center gap-2 bg-[#F4622A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#E05520] transition"
            >
              <Plus className="w-4 h-4" />Add Task
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          {STATS.map((s) => (
            <div key={s.label} className={`${s.color} rounded-lg p-2.5 text-center`}>
              <div className="text-sm font-bold">{s.value}</div>
              <div className="text-xs font-medium opacity-70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Tasks List</h2>
          <div className="flex flex-wrap items-center gap-2">
            <SearchDropdown
              value={search.q}
              onChange={(q) => setFilter({ q })}
              onSelect={(item) => navigate({ to: '/tasks/$taskId', params: { taskId: item.id } })}
              suggestions={tasks.map((t) => ({
                id: t.id,
                label: t.name,
                subtitle: projectMap[t.projectId] ?? t.projectName ?? undefined,
              }))}
              placeholder="Search by task..."
              className="min-w-[220px]"
            />
            <select
              value={search.status}
              onChange={(e) => setFilter({ status: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#F4622A]"
            >
              <option value="">Select Status</option>
              <option value="to_do">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={search.projectId}
              onChange={(e) => setFilter({ projectId: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#F4622A]"
            >
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <select
              value={search.priority}
              onChange={(e) => setFilter({ priority: e.target.value })}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#F4622A]"
            >
              <option value="">All Priorities</option>
              {TASK_PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 min-h-0">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 z-10 bg-white border-b border-gray-50">
                  {['S.No', 'Project', 'Task Name', 'Assigned User', 'Due Date', 'Created By', 'Status', 'Priority', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">No tasks found</td></tr>
                ) : tasks.map((task, i) => (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{String((search.page - 1) * PAGE_SIZE + i + 1).padStart(2, '0')}</td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-600 whitespace-nowrap">{projectMap[task.projectId] ?? task.projectName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Link to="/tasks/$taskId" params={{ taskId: task.id }} className="font-medium text-gray-800 hover:text-[#F4622A] transition-colors whitespace-nowrap">
                        {task.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><AvatarGroup names={task.assignees.map((a) => a.name)} max={3} size="xs" /></td>
                    <td className={cn('px-4 py-3 text-xs whitespace-nowrap', isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-500 font-medium' : 'text-gray-500')}>
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{task.createdByName}</td>
                    <td className="px-4 py-3"><InlineStatusDropdown task={task} /></td>
                    <td className="px-4 py-3"><InlinePriorityDropdown task={task} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to="/tasks/$taskId" params={{ taskId: task.id }} className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition inline-flex" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        {isAdmin && (
                          <button onClick={() => editModal.open(task)} className="p-1.5 rounded-lg text-[#F4622A] hover:bg-orange-50 transition inline-flex" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => deleteModal.open(task)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition inline-flex" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex-shrink-0">
          <Pagination
            page={search.page}
            totalPages={data?.totalPages ?? 1}
            total={data?.total ?? 0}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      </div>

      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Add Task" size="lg">
        <TaskForm onSuccess={createModal.close} onCancel={createModal.close} />
      </Modal>

      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Edit Task" size="lg">
        {editModal.data && (
          <TaskForm
            initial={editModal.data}
            onSuccess={editModal.close}
            onCancel={editModal.close}
          />
        )}
      </Modal>

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => { deleteModal.close(); setDeleteError('') }}
        onConfirm={async () => {
          if (deleteModal.data) {
            setDeleteError('')
            try {
              await deleteTask.mutateAsync(deleteModal.data.id)
              deleteModal.close()
            } catch (err: any) {
              setDeleteError(err?.message ?? 'Failed to delete task.')
            }
          }
        }}
        loading={deleteTask.isPending}
        message={`Delete task "${deleteModal.data?.name}"?`}
        error={deleteError}
      />
    </div>
  )
}
