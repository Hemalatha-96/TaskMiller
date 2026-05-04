import { createFileRoute } from '@tanstack/react-router'
import { Building2, Search, ArrowRight, Calendar, List, LayoutGrid, ChevronDown, Plus } from 'lucide-react'
import { useOrgs } from '../../../../queries/orgs.queries'
import { useDebounce } from '../../../../hooks/useDebounce'
import { setSelectedOrg } from '../../../../store/orgContext.store'
import { formatDate, userColor, getInitials } from '../../../../lib/utils'
import { CardSkeleton, TableSkeleton } from '../../../../components/ui/Skeleton'
import Pagination from '../../../../components/ui/Pagination'
import type { Organization } from '../../../../types/org.types'

export const Route = createFileRoute('/_dashboard/superadmin/organizations/')({
  validateSearch: (search: Record<string, unknown>) => ({
    search: (search.search as string)  || undefined,
    sortBy: ((search.sortBy as string) || undefined) as 'name' | 'createdAt' | undefined,
    order:  ((search.order  as string) || undefined) as 'asc' | 'desc' | undefined,
    page:   Number(search.page)  > 1  ? Number(search.page)  : undefined,
    limit:  Number(search.limit) > 0 && Number(search.limit) !== 10 ? Number(search.limit) : undefined,
    view:   (search.view as string) === 'list' ? ('list' as const) : undefined,
  }),
  component: SuperAdminOrganizations,
})

const sortOptions = [
  { label: 'Name A–Z',  sortBy: 'name',      order: 'asc'  },
  { label: 'Name Z–A',  sortBy: 'name',      order: 'desc' },
  { label: 'Newest',    sortBy: 'createdAt', order: 'desc' },
  { label: 'Oldest',    sortBy: 'createdAt', order: 'asc'  },
] as const

function SuperAdminOrganizations() {
  const navigate = Route.useNavigate()
  const { search = '', sortBy = 'createdAt', order = 'desc', page = 1, limit = 10, view = 'grid' } = Route.useSearch()
  const setParams = (params: Record<string, any>) =>
    navigate({ search: (prev) => ({ ...prev, ...params }) as any })

  const debouncedSearch = useDebounce(search, 400)

  const activeSortIdx  = sortOptions.findIndex(o => o.sortBy === sortBy && o.order === order)
  const currentSortIdx = activeSortIdx === -1 ? 2 : activeSortIdx

  const { data, isLoading, isFetching } = useOrgs({
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

  const handleOrgClick = (org: Organization) => {
    setSelectedOrg(org)
    navigate({ to: '/organizations/$orgId', params: { orgId: org.slug }, search: { from: 'superadmin', view: view === 'list' ? 'list' : undefined } as any })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden bg-white rounded-xl border border-gray-100">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-800">
              Organizations
              <span className="text-gray-400 font-normal ml-1.5">({totalRecords})</span>
            </h2>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setParams({ view: 'list' })}
                className={`p-1.5 transition-colors cursor-pointer ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setParams({ view: undefined })}
                className={`p-1.5 transition-colors cursor-pointer ${view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
              <input
                value={search}
                onChange={(e) => setParams({ search: e.target.value || undefined, page: undefined })}
                placeholder="Search organizations"
                className="bg-transparent outline-none w-40 text-gray-700 placeholder-gray-400 text-xs"
              />
              <Search size={13} className={isFetching ? 'text-orange-400 animate-pulse' : 'text-gray-400'} />
            </div>

            <div className="relative">
              <select
                value={currentSortIdx}
                onChange={(e) => {
                  const opt = sortOptions[Number(e.target.value)]
                  setParams({
                    sortBy: opt.sortBy !== 'createdAt' ? opt.sortBy : undefined,
                    order:  opt.order  !== 'desc'      ? opt.order  : undefined,
                    page:   undefined,
                  })
                }}
                className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs text-gray-600 bg-white outline-none cursor-pointer"
              >
                {sortOptions.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
            </div>

            <button
              onClick={() => navigate({ to: '/superadmin/organizations/new' })}
              className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <Plus size={13} /> Add Organization
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            view === 'list' ? (
              <div className="p-5"><TableSkeleton rows={8} cols={4} /></div>
            ) : (
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <CardSkeleton key={i} />)}
              </div>
            )
          ) : orgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <Building2 size={22} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">No organizations found</p>
              <p className="text-xs text-gray-400">Try a different search term</p>
            </div>
          ) : view === 'list' ? (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-200 text-xs text-gray-600 font-semibold uppercase tracking-wide">
                  <th className="px-5 py-3 text-left w-10 bg-[#ccfbf1]">S.no</th>
                  <th className="px-5 py-3 text-left bg-[#ccfbf1]">Organization</th>
                  <th className="px-5 py-3 text-left bg-[#ccfbf1]">Slug</th>
                  <th className="px-5 py-3 text-left bg-[#ccfbf1]">Created</th>
                  <th className="px-5 py-3 w-12 bg-[#ccfbf1]" />
                </tr>
              </thead>
              <tbody>
                {orgs.map((org, idx) => {
                  const color = userColor(org.id)
                  return (
                    <tr
                      key={org.id}
                      onClick={() => handleOrgClick(org)}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3 text-gray-400 text-xs">{startEntry + idx}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white font-bold text-xs">{getInitials(org.name)}</span>
                          </div>
                          <p className="font-medium text-gray-800">{org.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400 font-mono">/{org.slug}</td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(org.createdAt)}</td>
                      <td className="px-5 py-3">
                        <ArrowRight size={14} className="text-gray-300 group-hover:text-orange-400 transition-colors ml-auto" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {orgs.map((org) => {
                const color = userColor(org.id)
                return (
                  <div
                    key={org.id}
                    onClick={() => handleOrgClick(org)}
                    className="group relative bg-white border border-gray-100 rounded-xl p-4 hover:border-orange-200 hover:shadow-md cursor-pointer transition-all"
                  >
                    <ArrowRight size={13} className="absolute top-3.5 right-3.5 text-gray-300 group-hover:text-orange-400 transition-colors" />
                    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                      <span className="text-white font-bold text-sm">{getInitials(org.name)}</span>
                    </div>
                    <p className="font-semibold text-gray-800 text-sm leading-snug">{org.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 mb-3">/{org.slug}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 border-t border-gray-50 pt-2.5">
                      <Calendar size={11} />
                      <span>{formatDate(org.createdAt)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {!isLoading && totalPages > 0 && (
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
          onLimitChange={(l) => setParams({ limit: l !== 10 ? l : undefined, page: undefined })}
        />
      )}
    </div>
  )
}
