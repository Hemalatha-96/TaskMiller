import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Search, ChevronDown,
  FolderKanban, CheckCircle2, Clock, AlertCircle, TrendingUp, ListTodo, Timer, PauseCircle, Hourglass,
} from 'lucide-react'
import { type SortingState } from '@tanstack/react-table'
import { useTasks } from '../../queries/tasks.queries'
import { useProjects } from '../../queries/projects.queries'
import { useOrgContext } from '../../store/orgContext.store'
import { useAuth } from '../../hooks/useAuth'
import { useDebounce } from '../../hooks/useDebounce'
import StatsCard from '../../components/ui/StatsCard'
import Pagination from '../../components/ui/Pagination'
import TaskTable from '../../components/tasks/TaskTable'
import { StatsSkeleton, TableSkeleton } from '../../components/ui/Skeleton'
import type { TaskStatus } from '../../types/task.types'

export const Route = createFileRoute('/_dashboard/dashboard')({
  validateSearch: (search: Record<string, unknown>) => ({
    search:        (search.search as string)        || undefined,
    statusFilter:  ((search.statusFilter as string) || undefined) as TaskStatus | undefined,
    projectFilter: (search.projectFilter as string) || undefined,
    sortBy:        (search.sortBy as string)        || undefined,
    sortDir:       (search.sortDir as string) === 'desc' ? 'desc' as const : undefined,
    page:          Number(search.page)  > 1  ? Number(search.page)  : undefined,
    limit:         Number(search.limit) > 0 && Number(search.limit) !== 10 ? Number(search.limit) : undefined,
  }),
  component: DashboardPage,
})

function DashboardPage() {
  const { isSuperAdmin, isDeveloper, user, isAdmin } = useAuth()
  const { selectedOrg }                              = useOrgContext()

  const orgId          = isSuperAdmin && selectedOrg ? selectedOrg.id : undefined
  const assignedUserId = isDeveloper ? (user?.id ?? undefined) : undefined

  const navigate = Route.useNavigate()
  const { search = '', statusFilter = '', projectFilter = '', sortBy = '', sortDir = 'asc', page = 1, limit = 10 } = Route.useSearch()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setParams = (params: Record<string, any>) =>
    navigate({ search: (prev) => ({ ...prev, ...params }) as any })

  const sorting: SortingState = sortBy ? [{ id: sortBy, desc: sortDir === 'desc' }] : []

  useEffect(() => { setParams({ page: undefined }) }, [selectedOrg?.id])

  const debouncedSearch = useDebounce(search, 400)

  const sortOrder = sortBy ? sortDir : undefined

  const { data: tasksData, isLoading: isLoadingTasks, isFetching } = useTasks({
    search:    debouncedSearch || undefined,
    status:    statusFilter    || undefined,
    projectId: projectFilter   || undefined,
    orgId,
    assignedUserId,
    sortBy:    sortBy || undefined,
    sortOrder,
    page,
    limit,
  })

  const { data: projectsCountData } = useProjects({ orgId, limit: 1 })
  const { data: projectsListData }  = useProjects({ orgId, limit: 100 })

  const taskStats      = tasksData?.stats
  const totalTasks     = taskStats?.total       ?? 0
  const completedCount = taskStats?.completed   ?? 0
  const todoCount      = taskStats?.todo        ?? 0
  const inProgressCount = taskStats?.inProgress ?? 0
  const onHoldCount    = taskStats?.onHold      ?? 0
  const overdueCount   = taskStats?.overdue     ?? 0
  const onTimeCount    = taskStats?.onTime      ?? 0
  const offTimeCount   = taskStats?.offTime     ?? 0
  const totalProjects  = projectsCountData?.pagination.totalRecords ?? 0

  const tasks      = tasksData?.tasks      ?? []
  const pagination = tasksData?.pagination
  const projects   = projectsListData?.projects ?? []

  const totalRecords = pagination?.totalRecords ?? 0
  const totalPages   = pagination?.totalPages   ?? 1
  const activePage   = pagination?.currentPage  ?? page
  const activeLimit  = pagination?.limit        ?? limit
  const startEntry   = totalRecords === 0 ? 0 : (activePage - 1) * activeLimit + 1
  const endEntry     = Math.min(activePage * activeLimit, totalRecords)

  const stats = [
    { label: 'Projects',         value: totalProjects,   iconBg: 'bg-pink-100',   icon: <FolderKanban size={17} className="text-pink-500"   /> },
    { label: 'Tasks',            value: totalTasks,      iconBg: 'bg-orange-100', icon: <ListTodo     size={17} className="text-orange-500" /> },
    { label: 'Completed',        value: completedCount,  iconBg: 'bg-green-100',  icon: <CheckCircle2 size={17} className="text-green-500"  /> },
    { label: 'To Do',            value: todoCount,       iconBg: 'bg-gray-100',   icon: <Hourglass    size={17} className="text-gray-500"   /> },
    { label: 'In Progress',      value: inProgressCount, iconBg: 'bg-blue-100',   icon: <Timer        size={17} className="text-blue-500"   /> },
    { label: 'On Hold',          value: onHoldCount,     iconBg: 'bg-yellow-100', icon: <PauseCircle  size={17} className="text-yellow-500" /> },
    { label: 'Overdue',          value: overdueCount,    iconBg: 'bg-red-100',    icon: <AlertCircle  size={17} className="text-red-500"    /> },
    { label: 'On Time',          value: onTimeCount,     iconBg: 'bg-teal-100',   icon: <Clock        size={17} className="text-teal-500"   /> },
    { label: 'Off Time',         value: offTimeCount,    iconBg: 'bg-purple-100', icon: <Timer        size={17} className="text-purple-500" /> },
    {
      label: 'Completion\nRate',
      value: `${totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}%`,
      iconBg: 'bg-indigo-100',
      icon: <TrendingUp size={17} className="text-indigo-500" />,
    },
  ]

  const handleSearch        = (val: string)          => setParams({ search: val || undefined,        page: undefined })
  const handleStatusChange  = (val: TaskStatus | '') => setParams({ statusFilter: val || undefined,  page: undefined })
  const handleProjectChange = (val: string)          => setParams({ projectFilter: val || undefined, page: undefined })
  const handleLimit         = (val: number)          => setParams({ limit: val !== 10 ? val : undefined, page: undefined })
  const handleSorting       = (updater: any)         => {
    const next: SortingState = typeof updater === 'function' ? updater(sorting) : updater
    setParams({ sortBy: next[0]?.id || undefined, sortDir: next[0]?.desc ? 'desc' : undefined, page: undefined })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Stats */}
      <div className="flex-shrink-0 mb-5">
        {isLoadingTasks ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 xl:grid-cols-10 gap-3">
            {stats.map((s) => <StatsCard key={s.label} {...s} />)}
          </div>
        )}
      </div>

      {/* Tasks List */}
      <div className="flex flex-col flex-1 overflow-hidden bg-white rounded-xl border border-gray-100 min-h-0">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Tasks List
            <span className="text-gray-400 font-normal ml-1.5">({totalRecords})</span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap">

            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50">
              <Search size={14} className={isFetching ? 'text-orange-400 animate-pulse' : 'text-gray-400'} />
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by task"
                className="bg-transparent outline-none w-32 text-gray-700 placeholder-gray-400 text-xs"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus | '')}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-gray-500 bg-gray-50 outline-none cursor-pointer"
              >
                <option value="">Select Status</option>
                <option value="to_do">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={projectFilter}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-gray-500 bg-gray-50 outline-none cursor-pointer"
              >
                <option value="">Select Project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
            </div>

          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingTasks ? (
            <div className="p-5">
              <TableSkeleton rows={8} cols={7} />
            </div>
          ) : (
            <TaskTable
              tasks={tasks}
              projects={projects}
              startEntry={startEntry}
              isAdmin={isAdmin}
              sorting={sorting}
              onSortingChange={handleSorting}
            />
          )}
        </div>

      </div>

      {/* Pagination footer */}
      {!isLoadingTasks && totalPages > 0 && (
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

    </div>
  )
}
