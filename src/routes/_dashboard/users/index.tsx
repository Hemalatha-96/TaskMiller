import { useEffect, useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { authStore } from '../../../store/auth.store'
import { Plus, Search, ChevronDown, Download } from 'lucide-react'
import { type SortingState } from '@tanstack/react-table'
import { useUsers } from '../../../queries/users.queries'
import { useOrgContext } from '../../../store/orgContext.store'
import { useDebounce } from '../../../hooks/useDebounce'
import { useAuth } from '../../../hooks/useAuth'
import UserTable from '../../../components/users/UserTable'
import Pagination from '../../../components/ui/Pagination'
import { TableSkeleton } from '../../../components/ui/Skeleton'
import ErrorMessage from '../../../components/common/ErrorMessage'
import { exportOrgMembersApi } from '../../../http/services/export.service'
import { downloadCsv } from '../../../lib/exportCsv'
import type { ApiError } from '../../../types/api.types'
import type { UserStatus } from '../../../types/user.types'

export const Route = createFileRoute('/_dashboard/users/')({
  beforeLoad: () => {
    const role = authStore.state.user?.role
    if (role === 'developer') throw redirect({ to: '/dashboard', search: {} as any })
  },
  validateSearch: (search: Record<string, unknown>) => ({
    search:  (search.search as string) || undefined,
    filter:  ((search.filter as string) || undefined) as UserFilter | undefined,
    sortBy:  (search.sortBy as string) || undefined,
    sortDir: (search.sortDir as string) === 'desc' ? 'desc' as const : undefined,
    page:    Number(search.page)  > 1  ? Number(search.page)  : undefined,
    limit:   Number(search.limit) > 0 && Number(search.limit) !== 10 ? Number(search.limit) : undefined,
  }),
  component: UsersPage,
})

type UserFilter = UserStatus | 'unassigned' | ''

function UsersPage() {
  const { isAdmin, isSuperAdmin, user: me } = useAuth()
  const { selectedOrg } = useOrgContext()
  const navigate = Route.useNavigate()
  const { search = '', filter = '' as UserFilter, sortBy = '', sortDir = 'asc', page = 1, limit = 10 } = Route.useSearch()
  const [isExporting, setIsExporting] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setParams = (params: Record<string, any>) =>
    navigate({ search: (prev) => ({ ...prev, ...params }) as any })

  const sorting: SortingState = sortBy ? [{ id: sortBy, desc: sortDir === 'desc' }] : []

  useEffect(() => { setParams({ page: undefined }) }, [selectedOrg?.id])


  const debouncedSearch = useDebounce(search, 400)

  const sortOrder = sortBy ? sortDir : undefined

  const { data, isLoading, isFetching, error } = useUsers({
    search:     debouncedSearch || undefined,
    status:     filter === 'active' || filter === 'inactive' ? filter : undefined,
    unassigned: filter === 'unassigned' ? true : undefined,
    orgId:      isSuperAdmin && selectedOrg ? selectedOrg.id : undefined,
    sortBy:     sortBy || undefined,
    sortOrder,
    page,
    limit,
  })

  const users      = data?.users      ?? []
  const pagination = data?.pagination

  const totalRecords = pagination?.totalRecords ?? 0
  const totalPages   = pagination?.totalPages   ?? 1
  const activePage   = pagination?.currentPage  ?? page
  const activeLimit  = pagination?.limit        ?? limit
  const startEntry   = totalRecords === 0 ? 0 : (activePage - 1) * activeLimit + 1
  const endEntry     = Math.min(activePage * activeLimit, totalRecords)

  const handleSearch  = (val: string)     => setParams({ search: val || undefined, page: undefined })
  const handleFilter  = (val: UserFilter) => setParams({ filter: val || undefined, page: undefined })
  const handleLimit   = (val: number)     => setParams({ limit: val !== 10 ? val : undefined, page: undefined })
  const handleSorting = (updater: any)    => {
    const next: SortingState = typeof updater === 'function' ? updater(sorting) : updater
    setParams({ sortBy: next[0]?.id || undefined, sortDir: next[0]?.desc ? 'desc' : undefined, page: undefined })
  }

  const exportOrgId = isSuperAdmin && selectedOrg ? selectedOrg.id : me?.orgId ?? null

  const handleExportMembers = async () => {
    if (!exportOrgId || isExporting) return
    setIsExporting(true)
    try {
      const data = await exportOrgMembersApi(exportOrgId)
      const rows: unknown[][] = [
        ['Org Name', data.orgName],
        ['Total Members', data.totalMembers],
        [],
        ['Name', 'Email', 'Role', 'Joined At'],
        ...data.members.map((m) => [m.name, m.email, m.role, m.joinedAt]),
      ]
      downloadCsv(rows, `org-members-${data.orgName.toLowerCase().replace(/\s+/g, '-')}.csv`)
    } catch (err) {
      console.error('[Export] Failed to export org members:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* Table card */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white rounded-xl border border-gray-100">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            {isSuperAdmin && selectedOrg ? selectedOrg.name : 'All'}{' '}
            <span className="text-gray-400 font-normal ml-1">({totalRecords})</span>
          </h2>
          <div className="flex items-center gap-2">

            {/* Status / Unassigned filter */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => handleFilter(e.target.value as UserFilter)}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-gray-600 bg-gray-50 outline-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="unassigned">Unassigned</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50">
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name"
                className="bg-transparent outline-none w-36 text-gray-700 placeholder-gray-400 text-xs"
              />
              <Search size={13} className={isFetching ? 'text-orange-400 animate-pulse' : 'text-gray-400'} />
            </div>

            {exportOrgId && (
              <button
                onClick={handleExportMembers}
                disabled={isExporting}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                title="Export org members as CSV"
              >
                <Download size={13} />
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => navigate({ to: '/users/new' })}
                className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <Plus size={13} /> Add User
              </button>
            )}

          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="p-5">
              <TableSkeleton rows={10} cols={8} />
            </div>
          ) : error ? (
            <div className="p-5">
              <ErrorMessage message={(error as ApiError)?.message ?? 'Failed to load users'} />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <UserTable
              users={users}
              activePage={activePage}
              activeLimit={activeLimit}
              isAdmin={isAdmin}
              myId={me?.id}
              sorting={sorting}
              onSortingChange={handleSorting}
            />
          )}
        </div>

      </div>

      {/* Pagination footer */}
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
          onLimitChange={handleLimit}
        />
      )}

    </div>
  )
}
