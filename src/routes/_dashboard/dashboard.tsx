import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import {
  Search, ChevronDown,
  FolderKanban, CheckCircle2, Clock, AlertCircle, TrendingUp, ListTodo, Timer, PauseCircle, Hourglass,
  Building2, ArrowRight, LayoutList, LayoutGrid, Eye, Loader2,
} from 'lucide-react'
import { type SortingState } from '@tanstack/react-table'
import { useTasks } from '../../queries/tasks.queries'
import { useProjects } from '../../queries/projects.queries'
import { useOrgs } from '../../queries/orgs.queries'
import { useOrgContext, setSelectedOrg } from '../../store/orgContext.store'
import { useAuth } from '../../hooks/useAuth'
import { useViewMode, setViewMode } from '../../store/viewMode.store'
import { useDebounce } from '../../hooks/useDebounce'
import StatsCard from '../../components/ui/StatsCard'
import Pagination from '../../components/ui/Pagination'
import TaskTable from '../../components/tasks/TaskTable'
import DateRangePicker from '../../components/ui/DateRangePicker'
import { StatsSkeleton, TableSkeleton } from '../../components/ui/Skeleton'
import { userColor, formatDate } from '../../lib/utils'
import type { TaskStatusFilter } from '../../types/task.types'
import type { Organization } from '../../types/org.types'

export const Route = createFileRoute('/_dashboard/dashboard')({
  validateSearch: (search: Record<string, unknown>) => ({
    view:          ((search.view as string) === 'superadmin' ? 'superadmin' : (search.view as string) === 'admin' ? 'admin' : undefined) as 'superadmin' | 'admin' | undefined,
    orgView:       ((search.orgView as string) === 'list' ? 'list' : 'card') as 'list' | 'card',
    search:        (search.search as string)        || undefined,
    statusFilter:  ((search.statusFilter as string) || undefined) as TaskStatusFilter | undefined,
    projectFilter: (search.projectFilter as string) || undefined,
    dueDateFrom:   (search.dueDateFrom as string)   || undefined,
    dueDateTo:     (search.dueDateTo as string)     || undefined,
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
  const storedViewMode                               = useViewMode()

  const navigate       = Route.useNavigate()
  const globalNavigate = useNavigate()
  const { view: viewParam, orgView = 'card', search = '', statusFilter = '', projectFilter = '', dueDateFrom, dueDateTo, sortBy = '', sortDir = 'asc', page = 1, limit = 10 } = Route.useSearch()

  // URL param is canonical; fall back to stored value
  const effectiveViewMode = viewParam ?? storedViewMode

  // Keep store in sync when URL param changes
  useEffect(() => {
    if (viewParam) setViewMode(viewParam)
  }, [viewParam])

  const isSuperAdminView = isSuperAdmin && effectiveViewMode === 'superadmin'

  // In superadmin view: no orgId filter so stats are global across all orgs
  const orgId          = isSuperAdminView ? undefined : (isSuperAdmin && selectedOrg ? selectedOrg.id : undefined)
  const assignedUserId = isDeveloper ? (user?.id ?? undefined) : undefined

  // Org list pagination state — used in superadmin view (must be above early returns)
  const [orgPage,  setOrgPage]  = useState(1)
  const [orgLimit, setOrgLimit] = useState(10)

  const { data: orgsData, isLoading: isLoadingOrgs } = useOrgs(
    { page: orgPage, limit: orgLimit },
    { enabled: isSuperAdminView },
  )
  const orgs          = orgsData?.organizations ?? []
  const orgPagination = orgsData?.pagination
  const orgTotal      = orgPagination?.totalRecords ?? 0
  const orgTotalPages = orgPagination?.totalPages   ?? 1
  const orgStart      = orgTotal === 0 ? 0 : (orgPage - 1) * orgLimit + 1
  const orgEnd        = Math.min(orgPage * orgLimit, orgTotal)

  const handleOrgClick = (org: Organization) => {
    setSelectedOrg(org)
    setViewMode('admin')
    globalNavigate({ to: '/dashboard', search: { view: 'admin' } as any })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setParams = (params: Record<string, any>) =>
    navigate({ search: (prev) => ({ ...prev, ...params }) as any })

  const sorting: SortingState = sortBy ? [{ id: sortBy, desc: sortDir === 'desc' }] : []

  useEffect(() => { setParams({ page: undefined }) }, [selectedOrg?.id])

  const debouncedSearch = useDebounce(search, 400)

  const sortOrder = sortBy ? sortDir : undefined

  const { data: tasksData, isLoading: isLoadingTasks, isFetching } = useTasks({
    search:       debouncedSearch || undefined,
    status:       statusFilter    || undefined,
    projectId:    projectFilter   || undefined,
    orgId,
    assignedUserId,
    dueDateFrom,
    dueDateTo,
    sortBy:       sortBy || undefined,
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

  // ── Super Admin View ─────────────────────────────────────────────────────────
  if (isSuperAdminView) {
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

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

        {/* Organizations — list / card */}
        <div className="flex flex-col flex-1 overflow-hidden bg-white rounded-xl border border-gray-100 min-h-0">

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              Organizations
              <span className="text-gray-400 font-normal ml-1.5">({orgTotal})</span>
            </h2>
            <div className="flex items-center gap-2">
              {orgView === 'list' && (
                <p className="text-xs text-gray-400">Click the View icon to open as admin</p>
              )}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setParams({ orgView: 'list' })}
                  className={`p-1.5 transition-colors cursor-pointer ${orgView === 'list' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  title="List view"
                ><LayoutList size={14} /></button>
                <button
                  onClick={() => setParams({ orgView: 'card' })}
                  className={`p-1.5 transition-colors cursor-pointer ${orgView === 'card' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  title="Card view"
                ><LayoutGrid size={14} /></button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {isLoadingOrgs ? (
              orgView === 'list' ? (
                <div className="p-5"><TableSkeleton rows={6} cols={9} /></div>
              ) : (
                <div className="p-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              )
            ) : orgs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                  <Building2 size={22} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">No organizations found</p>
              </div>
            ) : orgView === 'list' ? (

              /* ── List view ── */
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
                    <OrgStatRow
                      key={org.id}
                      org={org}
                      idx={idx}
                      onView={handleOrgClick}
                    />
                  ))}
                </tbody>
              </table>

            ) : (

              /* ── Card view ── */
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
                {orgs.map((org) => {
                  const color = userColor(org.id)
                  return (
                    <button
                      key={org.id}
                      onClick={() => handleOrgClick(org)}
                      className="group text-left bg-white border border-gray-100 rounded-xl p-4 hover:border-orange-300 hover:shadow-md hover:shadow-orange-50 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-bold text-sm">{org.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <ArrowRight size={14} className="text-gray-300 group-hover:text-orange-400 transition-colors mt-1" />
                      </div>
                      <p className="font-semibold text-gray-800 text-sm truncate mb-1">{org.name}</p>
                      <p className="text-xs text-gray-400 font-mono mb-2 truncate">/{org.slug}</p>
                      <p className="text-xs text-gray-400">{formatDate(org.createdAt)}</p>
                    </button>
                  )
                })}
              </div>

            )}
          </div>

          {!isLoadingOrgs && orgTotalPages > 0 && (
            <Pagination
              page={orgPage}
              totalPages={orgTotalPages}
              totalRecords={orgTotal}
              startEntry={orgStart}
              endEntry={orgEnd}
              limit={orgLimit}
              hasPrevPage={orgPagination?.hasPrevPage}
              hasNextPage={orgPagination?.hasNextPage}
              onPageChange={setOrgPage}
              onLimitChange={(v) => { setOrgLimit(v); setOrgPage(1) }}
            />
          )}
        </div>

      </div>
    )
  }

  // ── Admin / Developer view continues below ───────────────────────────────────
  const handleSearch        = (val: string)          => setParams({ search: val || undefined,        page: undefined })
  const handleStatusChange  = (val: TaskStatusFilter | '') => setParams({ statusFilter: val || undefined,  page: undefined })
  const handleProjectChange = (val: string)          => setParams({ projectFilter: val || undefined, page: undefined })
  const handleDateRange     = (range: { from: string | undefined; to: string | undefined }) =>
    setParams({ dueDateFrom: range.from || undefined, dueDateTo: range.to || undefined, page: undefined })
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
                onChange={(e) => handleStatusChange(e.target.value as TaskStatusFilter | '')}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-gray-500 bg-gray-50 outline-none cursor-pointer"
              >
                <option value="">Select Status</option>
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
                value={projectFilter}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-gray-500 bg-gray-50 outline-none cursor-pointer"
              >
                <option value="">Select Project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
            </div>

            <DateRangePicker
              value={{ from: dueDateFrom, to: dueDateTo }}
              onChange={handleDateRange}
            />

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

// ─── OrgStatRow ───────────────────────────────────────────────────────────────

function OrgStatRow({
  org, idx, onView,
}: {
  org:    Organization
  idx:    number
  onView: (org: Organization) => void
}) {
  const { data: projData,  isLoading: isProjLoading  } = useProjects({ orgId: org.id, limit: 1 })
  const { data: tasksData, isLoading: isTasksLoading } = useTasks({ orgId: org.id, limit: 1 })
  const isLoading = isProjLoading || isTasksLoading
  const color = userColor(org.id)

  const cell = (value: number | undefined, colorClass?: string) => {
    if (isLoading)           return <Loader2 size={12} className="animate-spin text-gray-400 mx-auto" />
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
          className="text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
          title="View in Admin"
        >
          <Eye size={15} />
        </button>
      </td>
    </tr>
  )
}
