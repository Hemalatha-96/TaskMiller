import { createFileRoute, redirect } from '@tanstack/react-router'
import { Building2, FolderKanban, CheckCircle2, Clock, AlertCircle, TrendingUp, ListTodo, Timer, PauseCircle, Hourglass, Search } from 'lucide-react'
import { useTasks } from '../../../queries/tasks.queries'
import { useProjects } from '../../../queries/projects.queries'
import { useOrgs } from '../../../queries/orgs.queries'
import { authStore } from '../../../store/auth.store'
import { useDebounce } from '../../../hooks/useDebounce'
import StatsCard from '../../../components/ui/StatsCard'
import OrgStatsTable from '../../../components/superadmin/OrgStatsTable'
import Pagination from '../../../components/ui/Pagination'
import { StatsSkeleton, TableSkeleton } from '../../../components/ui/Skeleton'

export const Route = createFileRoute('/_dashboard/superadmin/dashboard')({
  beforeLoad: () => {
    const role = authStore.state.user?.role
    if (role === 'admin')     throw redirect({ to: '/admin/dashboard', search: {} as any })
    if (role === 'developer') throw redirect({ to: '/dashboard',       search: {} as any })
  },
  validateSearch: (search: Record<string, unknown>) => ({
    orgSearch: (search.orgSearch as string) || undefined,
    page:      Number(search.page)  > 1  ? Number(search.page)  : undefined,
    limit:     Number(search.limit) > 0 && Number(search.limit) !== 20 ? Number(search.limit) : undefined,
  }),
  component: SuperAdminDashboard,
})

function SuperAdminDashboard() {
  const navigate                      = Route.useNavigate()
  const { orgSearch = '', page = 1, limit = 20 } = Route.useSearch()
  const debouncedSearch               = useDebounce(orgSearch, 400)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setParams = (params: Record<string, any>) =>
    navigate({ search: (prev) => ({ ...prev, ...params }) as any })

  const { data: tasksData,    isLoading: isLoadingTasks    } = useTasks({ limit: 1 })
  const { data: projectsData, isLoading: isLoadingProjects } = useProjects({ limit: 1 })
  const { data: orgsData,     isLoading: isLoadingOrgs     } = useOrgs({
    search: debouncedSearch || undefined,
    page,
    limit,
  })

  const orgs       = orgsData?.organizations ?? []
  const pagination = orgsData?.pagination

  const totalOrgs   = pagination?.totalRecords ?? 0
  const totalPages  = pagination?.totalPages   ?? 1
  const activePage  = pagination?.currentPage  ?? page
  const activeLimit = pagination?.limit        ?? limit
  const startEntry  = totalOrgs === 0 ? 0 : (activePage - 1) * activeLimit + 1
  const endEntry    = Math.min(activePage * activeLimit, totalOrgs)

  const taskStats       = tasksData?.stats
  const totalTasks      = taskStats?.total       ?? 0
  const completedCount  = taskStats?.completed   ?? 0
  const todoCount       = taskStats?.todo        ?? 0
  const inProgressCount = taskStats?.inProgress  ?? 0
  const onHoldCount     = taskStats?.onHold      ?? 0
  const overdueCount    = taskStats?.overdue     ?? 0
  const onTimeCount     = taskStats?.onTime      ?? 0
  const totalProjects   = projectsData?.pagination?.totalRecords ?? 0

  const isLoading = isLoadingTasks || isLoadingProjects

  const stats = [
    { label: 'Organizations', value: totalOrgs,       iconBg: 'bg-orange-100', icon: <Building2    size={17} className="text-orange-500" /> },
    { label: 'Projects',      value: totalProjects,   iconBg: 'bg-pink-100',   icon: <FolderKanban size={17} className="text-pink-500"   /> },
    { label: 'Tasks',         value: totalTasks,      iconBg: 'bg-gray-100',   icon: <ListTodo     size={17} className="text-gray-500"   /> },
    { label: 'Completed',     value: completedCount,  iconBg: 'bg-green-100',  icon: <CheckCircle2 size={17} className="text-green-500"  /> },
    { label: 'To Do',         value: todoCount,       iconBg: 'bg-slate-100',  icon: <Hourglass    size={17} className="text-slate-500"  /> },
    { label: 'In Progress',   value: inProgressCount, iconBg: 'bg-blue-100',   icon: <Timer        size={17} className="text-blue-500"   /> },
    { label: 'On Hold',       value: onHoldCount,     iconBg: 'bg-yellow-100', icon: <PauseCircle  size={17} className="text-yellow-500" /> },
    { label: 'Overdue',       value: overdueCount,    iconBg: 'bg-red-100',    icon: <AlertCircle  size={17} className="text-red-500"    /> },
    { label: 'On Time',       value: onTimeCount,     iconBg: 'bg-teal-100',   icon: <Clock        size={17} className="text-teal-500"   /> },
    {
      label: 'Completion\nRate',
      value: `${totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}%`,
      iconBg: 'bg-indigo-100',
      icon: <TrendingUp size={17} className="text-indigo-500" />,
    },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden gap-5">

      <div className="flex-shrink-0">
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 xl:grid-cols-10 gap-3">
            {stats.map((s) => <StatsCard key={s.label} {...s} />)}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 overflow-hidden bg-white rounded-xl border border-gray-100 min-h-0">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            Organizations
            <span className="text-gray-400 font-normal ml-1.5">({totalOrgs})</span>
          </h2>
          <div className="relative flex items-center border border-gray-200 rounded-lg bg-gray-50 focus-within:border-teal-400 focus-within:bg-white transition-colors">
            <Search size={13} className="absolute left-3 text-gray-400 pointer-events-none" />
            <input
              value={orgSearch}
              onChange={(e) => setParams({ orgSearch: e.target.value || undefined, page: undefined })}
              placeholder="Search organizations..."
              className="bg-transparent outline-none text-xs text-gray-700 placeholder-gray-400 pl-8 pr-3 py-1.5 w-48"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoadingOrgs ? (
            <div className="p-5"><TableSkeleton rows={5} cols={10} /></div>
          ) : (
            <OrgStatsTable orgs={orgs} startEntry={startEntry} />
          )}
        </div>
      </div>

      {!isLoadingOrgs && totalPages > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalRecords={totalOrgs}
          startEntry={startEntry}
          endEntry={endEntry}
          limit={limit}
          hasPrevPage={pagination?.hasPrevPage}
          hasNextPage={pagination?.hasNextPage}
          onPageChange={(p) => setParams({ page: p > 1 ? p : undefined })}
          onLimitChange={(l) => setParams({ limit: l !== 20 ? l : undefined, page: undefined })}
        />
      )}

    </div>
  )
}
