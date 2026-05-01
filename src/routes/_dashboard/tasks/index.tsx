import { useState, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Plus, Search, ChevronDown,
  CheckCircle2, ListTodo, Timer, AlertCircle, PauseCircle,
} from 'lucide-react'
import { type SortingState } from '@tanstack/react-table'
import { useTasks, useDeleteTaskMutation } from '../../../queries/tasks.queries'
import { useProjects } from '../../../queries/projects.queries'
import { useAuth } from '../../../hooks/useAuth'
import { useOrgContext } from '../../../store/orgContext.store'
import { useDebounce } from '../../../hooks/useDebounce'
import StatsCard from '../../../components/ui/StatsCard'
import Pagination from '../../../components/ui/Pagination'
import TaskTable from '../../../components/tasks/TaskTable'
import DateRangePicker from '../../../components/ui/DateRangePicker'
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal'
import { StatsSkeleton, TableSkeleton } from '../../../components/ui/Skeleton'
import ErrorMessage from '../../../components/common/ErrorMessage'
import Kbd from '../../../components/ui/Kbd'
import type { Task, TaskStatusFilter } from '../../../types/task.types'
import type { ApiError } from '../../../types/api.types'

export const Route = createFileRoute('/_dashboard/tasks/')({
  validateSearch: (search: Record<string, unknown>) => ({
    search:       (search.search as string)       || undefined,
    status:       ((search.status as string)      || undefined) as TaskStatusFilter | undefined,
    projectId:    (search.projectId as string)    || undefined,
    dueDateFrom:  (search.dueDateFrom as string)  || undefined,
    dueDateTo:    (search.dueDateTo as string)    || undefined,
    sortBy:       (search.sortBy as string)       || undefined,
    sortDir:      (search.sortDir as string) === 'desc' ? 'desc' as const : undefined,
    page:         Number(search.page)  > 1  ? Number(search.page)  : undefined,
    limit:        Number(search.limit) > 0 && Number(search.limit) !== 10 ? Number(search.limit) : undefined,
  }),
  component: TasksPage,
})

function TasksPage() {
  const { isAdmin, isSuperAdmin, isDeveloper, user } = useAuth()
  const { selectedOrg }                     = useOrgContext()

  const orgId          = isSuperAdmin && selectedOrg ? selectedOrg.id : undefined
  const assignedUserId = isDeveloper ? (user?.id ?? undefined) : undefined

  const navigate = Route.useNavigate()
  const { search = '', status = '', projectId = '', dueDateFrom, dueDateTo, sortBy = '', sortDir = 'asc', page = 1, limit = 10 } = Route.useSearch()
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '/') return
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setParams = (params: Record<string, any>) =>
    navigate({ search: (prev) => ({ ...prev, ...params }) as any })

  const sorting: SortingState = sortBy ? [{ id: sortBy, desc: sortDir === 'desc' }] : []

  useEffect(() => { setParams({ page: undefined }) }, [selectedOrg?.id])


  const debouncedSearch = useDebounce(search, 400)

  const sortOrder = sortBy ? sortDir : undefined

  const { data, isLoading, isFetching, isError, error } = useTasks({
    search:       debouncedSearch || undefined,
    status:       status     || undefined,
    projectId:    projectId  || undefined,
    orgId,
    assignedUserId,
    dueDateFrom,
    dueDateTo,
    sortBy:       sortBy     || undefined,
    sortOrder,
    page,
    limit,
  })


  const { data: projectsData } = useProjects({ limit: 100, orgId })

  const { mutate: deleteTaskMutation, isPending: isDeleting } = useDeleteTaskMutation()

  const tasks      = data?.tasks      ?? []
  const pagination = data?.pagination
  const projects   = projectsData?.projects ?? []

  const totalRecords   = pagination?.totalRecords ?? 0
  const totalPages     = pagination?.totalPages   ?? 1
  const activePage     = pagination?.currentPage  ?? page
  const activeLimit    = pagination?.limit        ?? limit
  const startEntry     = totalRecords === 0 ? 0 : (activePage - 1) * activeLimit + 1
  const endEntry       = Math.min(activePage * activeLimit, totalRecords)

  const taskStats = data?.stats

  const stats = [
    { label: 'Total Tasks',  value: taskStats?.total      ?? 0, iconBg: 'bg-purple-100', icon: <ListTodo     size={17} className="text-purple-500" /> },
    { label: 'To Do',        value: taskStats?.todo        ?? 0, iconBg: 'bg-blue-100',   icon: <ListTodo     size={17} className="text-blue-500"   /> },
    { label: 'In Progress',  value: taskStats?.inProgress  ?? 0, iconBg: 'bg-orange-100', icon: <Timer        size={17} className="text-orange-500" /> },
    { label: 'On Hold',      value: taskStats?.onHold      ?? 0, iconBg: 'bg-yellow-100', icon: <PauseCircle  size={17} className="text-yellow-500" /> },
    { label: 'Overdue',      value: taskStats?.overdue     ?? 0, iconBg: 'bg-red-100',    icon: <AlertCircle  size={17} className="text-red-500"    /> },
    { label: 'Completed',    value: taskStats?.completed   ?? 0, iconBg: 'bg-green-100',  icon: <CheckCircle2 size={17} className="text-green-500"  /> },
  ]

  const handleDelete        = () => {
    if (!deleteTask) return
    deleteTaskMutation(deleteTask.id, { onSuccess: () => setDeleteTask(null) })
  }
  const handleSearch        = (val: string) => setParams({ search: val || undefined, page: undefined })
  const handleStatusChange  = (val: string) => setParams({ status: val || undefined, page: undefined })
  const handleProjectChange = (val: string) => setParams({ projectId: val || undefined, page: undefined })
  const handleDateRange     = (range: { from: string | undefined; to: string | undefined }) =>
    setParams({ dueDateFrom: range.from || undefined, dueDateTo: range.to || undefined, page: undefined })
  const handleLimit         = (val: number) => setParams({ limit: val !== 10 ? val : undefined, page: undefined })
  const handleSorting       = (updater: any) => {
    const next: SortingState = typeof updater === 'function' ? updater(sorting) : updater
    setParams({ sortBy: next[0]?.id || undefined, sortDir: next[0]?.desc ? 'desc' : undefined, page: undefined })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* Stats */}
      <div className="flex-shrink-0 mb-5">
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {stats.map((s) => <StatsCard key={s.label} {...s} />)}
          </div>
        )}
      </div>

      {/* Table card */}
      <div className="flex flex-col flex-1 overflow-hidden bg-white rounded-xl border border-gray-100 min-h-0">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Tasks List
            {!isLoading && <span className="text-gray-400 font-normal ml-1.5">({totalRecords})</span>}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">

            <div className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 transition-all duration-200 ${searchFocused ? 'border-orange-300 bg-white shadow-md shadow-orange-50' : 'border-gray-200 bg-gray-50'}`}>
              <Search size={14} className={isFetching ? 'text-orange-400 animate-pulse' : 'text-gray-400'} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search by task"
                className="bg-transparent outline-none w-32 text-gray-700 placeholder-gray-400 text-xs"
              />
              {!searchFocused && !search && <Kbd>/</Kbd>}
            </div>

            <div className="relative">
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-gray-500 bg-gray-50 outline-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="to_do">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-gray-500 bg-gray-50 outline-none cursor-pointer"
              >
                <option value="">All Projects</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
            </div>

            <DateRangePicker
              value={{ from: dueDateFrom, to: dueDateTo }}
              onChange={handleDateRange}
            />

            {isAdmin && (
              <button
                onClick={() => navigate({ to: '/tasks/new' })}
                className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 cursor-pointer"
              >
                <Plus size={13} /> Add Task
              </button>
            )}

          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="p-5">
              <TableSkeleton rows={8} cols={7} />
            </div>
          ) : isError ? (
            <div className="py-8 px-5">
              <ErrorMessage message={(error as ApiError)?.message ?? 'Failed to load tasks'} />
            </div>
          ) : (
            <TaskTable
              tasks={tasks}
              projects={projects}
              startEntry={startEntry}
              isAdmin={isAdmin}
              sorting={sorting}
              onSortingChange={handleSorting}
              onEdit={(task) => navigate({ to: '/tasks/$taskId/edit', params: { taskId: task.id } })}
              onDelete={setDeleteTask}
            />
          )}
        </div>

      </div>

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 0 && (
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
          onLimitChange={handleLimit}
        />
      )}

      {deleteTask  && (
        <ConfirmDeleteModal
          title="Delete Task"
          description={`Are you sure you want to delete "${deleteTask.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTask(null)}
          isLoading={isDeleting}
        />
      )}

    </div>
  )
}
