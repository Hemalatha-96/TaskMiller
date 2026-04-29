import { createFileRoute } from '@tanstack/react-router'
import { Plus, Search, ChevronDown } from 'lucide-react'
import { useOrgs } from '../../../queries/orgs.queries'
import { useDebounce } from '../../../hooks/useDebounce'
import OrgTable from '../../../components/organizations/OrgTable'
import Pagination from '../../../components/ui/Pagination'
import { TableSkeleton } from '../../../components/ui/Skeleton'
import ErrorMessage from '../../../components/common/ErrorMessage'
import type { ApiError } from '../../../types/api.types'

export const Route = createFileRoute('/_dashboard/organizations/')({
  validateSearch: (search: Record<string, unknown>) => ({
    search: (search.search as string) || undefined,
    sortBy: ((search.sortBy as string) || undefined) as 'name' | 'createdAt' | undefined,
    order:  ((search.order  as string) || undefined) as 'asc' | 'desc' | undefined,
    page:   Number(search.page)  > 1  ? Number(search.page)  : undefined,
    limit:  Number(search.limit) > 0 && Number(search.limit) !== 10 ? Number(search.limit) : undefined,
  }),
  component: OrganizationsPage,
})

const sortOptions = [
  { label: 'Name A–Z',  sortBy: 'name',      order: 'asc'  },
  { label: 'Name Z–A',  sortBy: 'name',      order: 'desc' },
  { label: 'Newest',    sortBy: 'createdAt', order: 'desc' },
  { label: 'Oldest',    sortBy: 'createdAt', order: 'asc'  },
] as const

function OrganizationsPage() {
  const navigate = Route.useNavigate()
  const { search = '', sortBy = 'createdAt', order = 'desc', page = 1, limit = 10 } = Route.useSearch()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setParams = (params: Record<string, any>) =>
    navigate({ search: (prev) => ({ ...prev, ...params }) as any })

  const debouncedSearch = useDebounce(search, 400)

  const activeSortIdx = sortOptions.findIndex(o => o.sortBy === sortBy && o.order === order)
  const currentSortIdx = activeSortIdx === -1 ? 2 : activeSortIdx

  const { data, isLoading, isFetching, error } = useOrgs({
    search: debouncedSearch || undefined,
    sortBy,
    order,
    page,
    limit,
  })

  const orgs       = data?.organizations ?? []
  const pagination = data?.pagination

  const totalRecords = pagination?.totalRecords ?? 0
  const totalPages   = pagination?.totalPages   ?? 1
  const activePage   = pagination?.currentPage  ?? page
  const activeLimit  = pagination?.limit        ?? limit
  const startEntry   = totalRecords === 0 ? 0 : (activePage - 1) * activeLimit + 1
  const endEntry     = Math.min(activePage * activeLimit, totalRecords)

  const handleSearch = (val: string) => setParams({ search: val || undefined, page: undefined })
  const handleSort   = (idx: number) => {
    const opt = sortOptions[idx]
    setParams({
      sortBy: opt.sortBy !== 'createdAt' ? opt.sortBy : undefined,
      order:  opt.order  !== 'desc'      ? opt.order  : undefined,
      page:   undefined,
    })
  }
  const handleLimit  = (val: number) => setParams({ limit: val !== 10 ? val : undefined, page: undefined })

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Card */}
      <div className="flex flex-col flex-1 overflow-hidden bg-white rounded-xl border border-gray-100">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            All <span className="text-gray-400 font-normal ml-1">({totalRecords})</span>
          </h2>

          <div className="flex items-center gap-2">

            <div className="relative">
              <select
                value={currentSortIdx}
                onChange={(e) => handleSort(Number(e.target.value))}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-gray-600 bg-white outline-none cursor-pointer"
              >
                {sortOptions.map((o, i) => (
                  <option key={i} value={i}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name"
                className="bg-transparent outline-none w-36 text-gray-700 placeholder-gray-400 text-xs"
              />
              <Search size={13} className={isFetching ? 'text-orange-400 animate-pulse' : 'text-gray-400'} />
            </div>

            <button
              onClick={() => navigate({ to: '/organizations/new' })}
              className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <Plus size={13} /> Add Organization
            </button>

          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-5">
              <TableSkeleton rows={8} cols={5} />
            </div>
          ) : error ? (
            <div className="p-5">
              <ErrorMessage message={(error as ApiError)?.message ?? 'Failed to load organizations'} />
            </div>
          ) : (
            <OrgTable orgs={orgs} />
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
