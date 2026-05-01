import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Plus, Search, ChevronDown,
  ArrowRight, Calendar, ArrowLeft,
  Hash, Users, ShieldCheck, Code2, Trash2, AlertTriangle, UserPlus,
} from 'lucide-react'
import { useOrgs, useOrg, useRemoveMemberMutation, useDeleteOrgMutation } from '../../../queries/orgs.queries'
import { useDebounce } from '../../../hooks/useDebounce'
import { useAuth } from '../../../hooks/useAuth'
import Pagination from '../../../components/ui/Pagination'
import { CardSkeleton, OrgDetailSkeleton } from '../../../components/ui/Skeleton'
import ErrorMessage from '../../../components/common/ErrorMessage'
import S3Image from '../../../components/ui/S3Image'
import { userColor, formatDate } from '../../../lib/utils'
import type { OrgMember } from '../../../types/org.types'
import type { ApiError } from '../../../types/api.types'

export const Route = createFileRoute('/_dashboard/organizations/')({
  validateSearch: (search: Record<string, unknown>) => {
    const raw  = (search.view as string) ?? ''
    const slash = raw.indexOf('/')
    const id    = slash > -1 ? raw.slice(slash + 1) || undefined : undefined
    return {
      search: (search.search as string) || undefined,
      sortBy: ((search.sortBy as string) || undefined) as 'name' | 'createdAt' | undefined,
      order:  ((search.order  as string) || undefined) as 'asc' | 'desc' | undefined,
      view:   (id ? `card/${id}` : 'card') as string,
      page:   Number(search.page)  > 1  ? Number(search.page)  : undefined,
      limit:  Number(search.limit) > 0 && Number(search.limit) !== 10 ? Number(search.limit) : undefined,
    }
  },
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
  const { isAdmin, isSuperAdmin } = useAuth()
  const { search = '', sortBy = 'createdAt', order = 'desc', view = 'card', page = 1, limit = 10 } = Route.useSearch()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setParams = (params: Record<string, any>) =>
    navigate({ search: (prev) => ({ ...prev, ...params }) as any })

  const slash      = view.indexOf('/')
  const selectedId = slash === -1 ? undefined : view.slice(slash + 1) || undefined

  const debouncedSearch = useDebounce(search, 400)
  const activeSortIdx   = sortOptions.findIndex(o => o.sortBy === sortBy && o.order === order)
  const currentSortIdx  = activeSortIdx === -1 ? 2 : activeSortIdx

  const { data, isLoading, isFetching, error } = useOrgs({
    search: debouncedSearch || undefined,
    sortBy,
    order,
    page,
    limit,
  })

  const orgs        = data?.organizations ?? []
  const pagination  = data?.pagination
  const totalRecords = pagination?.totalRecords ?? 0
  const totalPages   = pagination?.totalPages   ?? 1
  const activePage   = pagination?.currentPage  ?? page
  const activeLimit  = pagination?.limit        ?? limit
  const startEntry   = totalRecords === 0 ? 0 : (activePage - 1) * activeLimit + 1
  const endEntry     = Math.min(activePage * activeLimit, totalRecords)

  const selectedListOrg = selectedId ? orgs.find(o => o.slug === selectedId) ?? null : null
  const resolvedId      = selectedListOrg?.id ?? ''

  // Detail data & mutations (hooks always called unconditionally)
  const { data: org, isLoading: isDetailLoading, error: detailError } = useOrg(resolvedId)
  const { mutate: removeMember, isPending: isRemoving } = useRemoveMemberMutation()
  const { mutate: deleteOrg,   isPending: isDeleting  } = useDeleteOrgMutation()

  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [devPage,  setDevPage]  = useState(1)
  const [devLimit, setDevLimit] = useState(5)

  const handleRemove = (userId: string) => {
    removeMember({ orgId: resolvedId, userId }, { onSuccess: () => setConfirmRemove(null) })
  }

  const handleDeleteOrg = () => {
    deleteOrg(resolvedId, { onSuccess: () => setParams({ view: 'card' }) })
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selectedId) {
    if (isDetailLoading) return <OrgDetailSkeleton />

    if (detailError || !org) {
      return (
        <div className="space-y-4">
          <button
            onClick={() => setParams({ view: 'card' })}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={15} /> Back to Organizations
          </button>
          <ErrorMessage message={(detailError as ApiError)?.message ?? 'Organization not found'} />
        </div>
      )
    }

    const adminMember   = org.members.find(m => m.role === 'admin')
    const developers    = org.members.filter(m => m.role === 'developer')
    const devTotal      = developers.length
    const devTotalPages = Math.max(1, Math.ceil(devTotal / devLimit))
    const devStart      = (devPage - 1) * devLimit
    const devEnd        = devPage * devLimit
    const pagedDevs     = developers.slice(devStart, devEnd)

    return (
      <div className="flex-1 overflow-y-auto space-y-4 pb-6">

        <button
          onClick={() => setParams({ view: 'card' })}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Organizations
        </button>

        <div className="flex gap-5 items-start">

          {/* ── Left panel ───────────────────────────────────────────────── */}
          <div className="flex-1 space-y-4">

            {/* Header card */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-pink-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">{org.name.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-800 leading-tight">{org.name}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Hash size={11} className="text-gray-400" />
                    <span className="text-xs text-gray-400">{org.slug}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {org.description ?? <span className="text-gray-300 italic">No description provided</span>}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users size={14} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total Members</p>
                    <p className="text-lg font-bold text-gray-800 leading-none mt-0.5">{org.members.length}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={14} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Admin</p>
                    <p className="text-lg font-bold text-gray-800 leading-none mt-0.5">{adminMember ? 1 : 0}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Code2 size={14} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Developers</p>
                    <p className="text-lg font-bold text-gray-800 leading-none mt-0.5">{developers.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin section */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ShieldCheck size={15} className="text-blue-500" />
                  Admin
                </h3>
                {isSuperAdmin && (
                  <button
                    onClick={() => navigate({ to: '/organizations/$orgId/add-member', params: { orgId: selectedId }, search: { mode: 'admin' } })}
                    disabled={!!adminMember}
                    title={adminMember ? 'This org already has an admin' : 'Assign admin'}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <UserPlus size={13} /> Assign Admin
                  </button>
                )}
              </div>
              {adminMember ? (
                <MemberRow
                  member={adminMember}
                  canRemove={isSuperAdmin}
                  isRemoving={isRemoving && confirmRemove === adminMember.userId}
                  confirming={confirmRemove === adminMember.userId}
                  onRemoveClick={() => setConfirmRemove(adminMember.userId)}
                  onConfirmRemove={() => handleRemove(adminMember.userId)}
                  onCancelRemove={() => setConfirmRemove(null)}
                />
              ) : (
                <EmptySlot
                  icon={ShieldCheck}
                  label="No admin assigned"
                  sublabel={isSuperAdmin ? 'Use the Assign Admin button to add one.' : 'Contact your superadmin to assign an admin.'}
                />
              )}
            </div>

            {/* Developers section */}
            <div className="bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden" style={{ maxHeight: '440px' }}>
              <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Code2 size={15} className="text-green-500" />
                  Developers
                  <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {developers.length}
                  </span>
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => navigate({ to: '/organizations/$orgId/add-member', params: { orgId: selectedId }, search: { mode: 'developer' } })}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
                  >
                    <Plus size={13} /> Add Developer
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-2">
                {developers.length === 0 ? (
                  <EmptySlot
                    icon={Code2}
                    label="No developers assigned"
                    sublabel={isAdmin ? 'Use the Add Developer button to assign one.' : undefined}
                  />
                ) : (
                  <div className="space-y-1">
                    {pagedDevs.map((m) => (
                      <MemberRow
                        key={m.memberId}
                        member={m}
                        canRemove={isAdmin}
                        isRemoving={isRemoving && confirmRemove === m.userId}
                        confirming={confirmRemove === m.userId}
                        onRemoveClick={() => setConfirmRemove(m.userId)}
                        onConfirmRemove={() => handleRemove(m.userId)}
                        onCancelRemove={() => setConfirmRemove(null)}
                      />
                    ))}
                  </div>
                )}
              </div>
              {developers.length > 0 && (
                <Pagination
                  page={devPage}
                  totalPages={devTotalPages}
                  totalRecords={devTotal}
                  startEntry={devTotal === 0 ? 0 : devStart + 1}
                  endEntry={Math.min(devEnd, devTotal)}
                  limit={devLimit}
                  hasPrevPage={devPage > 1}
                  hasNextPage={devPage < devTotalPages}
                  onPageChange={p => setDevPage(p)}
                  onLimitChange={l => { setDevLimit(l); setDevPage(1) }}
                  className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-t border-gray-100"
                />
              )}
            </div>

            {/* Danger zone */}
            {isSuperAdmin && (
              <div className="bg-white rounded-xl border border-red-100 p-5">
                <h3 className="font-semibold text-red-600 flex items-center gap-2 mb-1">
                  <AlertTriangle size={15} />
                  Danger Zone
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Deleting this organization will soft-delete all its projects and tasks, and unassign all members.
                </p>
                {confirmDelete ? (
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-red-600 font-medium flex-1">Are you sure? This cannot be easily undone.</p>
                    <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={handleDeleteOrg} disabled={isDeleting} className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60">
                      {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={14} /> Delete Organization
                  </button>
                )}
              </div>
            )}

          </div>

          {/* ── Right panel ──────────────────────────────────────────────── */}
          <div className="w-52 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Details</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400">Name</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5 truncate">{org.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Slug</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Hash size={11} className="text-gray-400 flex-shrink-0" />
                    <p className="text-xs font-medium text-gray-600 truncate">{org.slug}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Members</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Users size={12} className="text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">{org.members.length}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Created</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">{formatDate(org.createdAt)}</p>
                </div>
                {org.updatedAt && (
                  <div>
                    <p className="text-xs text-gray-400">Updated</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">{formatDate(org.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

  // ── List / card page ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white rounded-xl border border-gray-100">

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
                {sortOptions.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
              <input
                value={search}
                onChange={(e) => setParams({ search: e.target.value || undefined, page: undefined })}
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

        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="p-5">
              <ErrorMessage message={(error as ApiError)?.message ?? 'Failed to load organizations'} />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
              {orgs.map((org) => {
                const color = userColor(org.id)
                return (
                  <div
                    key={org.id}
                    onClick={() => setParams({ view: `card/${org.slug}` })}
                    className="group relative bg-white border border-gray-100 rounded-xl p-4 hover:border-orange-200 hover:shadow-md cursor-pointer transition-all"
                  >
                    <ArrowRight size={13} className="absolute top-3.5 right-3.5 text-gray-300 group-hover:text-orange-400 transition-colors" />
                    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                      <span className="text-white font-bold text-sm">{org.name.charAt(0)}</span>
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
          onLimitChange={(val) => setParams({ limit: val !== 10 ? val : undefined, page: undefined })}
        />
      )}

    </div>
  )

  function handleSort(idx: number) {
    const opt = sortOptions[idx]
    setParams({
      sortBy: opt.sortBy !== 'createdAt' ? opt.sortBy : undefined,
      order:  opt.order  !== 'desc'      ? opt.order  : undefined,
      page:   undefined,
    })
  }
}

// ─── MemberRow ────────────────────────────────────────────────────────────────

function MemberRow({
  member, canRemove, isRemoving, confirming,
  onRemoveClick, onConfirmRemove, onCancelRemove,
}: {
  member:          OrgMember
  canRemove:       boolean
  isRemoving:      boolean
  confirming:      boolean
  onRemoveClick:   () => void
  onConfirmRemove: () => void
  onCancelRemove:  () => void
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`w-8 h-8 rounded-full ${userColor(member.userId)} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
        {member.avatarUrl ? (
          <S3Image storageKey={member.avatarUrl} fallbackInitials={member.name.charAt(0).toUpperCase()} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-xs font-semibold">{member.name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate">{member.name}</p>
        <p className="text-xs text-gray-400 truncate">{member.email}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
        <span className="text-xs text-gray-400 capitalize">{member.status}</span>
      </div>
      {canRemove && (
        confirming ? (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={onCancelRemove} className="px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={onConfirmRemove} disabled={isRemoving} className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600 transition-colors disabled:opacity-60">
              {isRemoving ? '...' : 'Remove'}
            </button>
          </div>
        ) : (
          <button onClick={onRemoveClick} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 cursor-pointer" title="Remove member">
            <Trash2 size={13} />
          </button>
        )
      )}
    </div>
  )
}

// ─── EmptySlot ────────────────────────────────────────────────────────────────

function EmptySlot({ icon: Icon, label, sublabel }: { icon: React.ElementType; label: string; sublabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon size={22} className="text-gray-200 mb-2" />
      <p className="text-sm text-gray-400">{label}</p>
      {sublabel && <p className="text-xs text-gray-300 mt-0.5">{sublabel}</p>}
    </div>
  )
}
