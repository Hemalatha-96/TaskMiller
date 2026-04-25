import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Plus, Eye } from 'lucide-react'
import { useCreateOrg, useOrgs, useDeleteOrg } from '../../../lib/queries/orgs.queries'
import { useAuth } from '../../../hooks/useAuth'
import { SearchDropdown } from '../../../components/common/SearchDropdown'
import { Modal } from '../../../components/ui/modal'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { ErrorMessage } from '../../../components/common/ErrorMessage'
import { ConfirmDeleteModal } from '../../../components/common/ConfirmDeleteModal'
import { useModal } from '../../../hooks/useModal'
import { formatDate } from '../../../utils/date'
import type { Organization } from '../../../types/org.types'

export const Route = createFileRoute('/_dashboard/orgs/')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || '',
  }),
  component: OrgsPage,
})

function OrgsPage() {
  const { data: orgs, isLoading, error } = useOrgs()
  const createOrg = useCreateOrg()
  const deleteOrg = useDeleteOrg()
  const createModal = useModal()
  const deleteModal = useModal<Organization>()
  const { isSuperAdmin } = useAuth()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [form, setForm] = useState({ name: '', slug: '' })
  const [deleteError, setDeleteError] = useState('')

  const filtered = useMemo(() => {
    const list = orgs ?? []
    const q = search.q.trim().toLowerCase()
    if (!q) return list
    return list.filter((o) => o.name.toLowerCase().includes(q))
  }, [orgs, search.q])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await createOrg.mutateAsync({
      name: form.name,
      slug: form.slug.trim() ? form.slug.trim() : undefined,
    })
    createModal.close()
    setForm({ name: '', slug: '' })
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      <div className="flex-shrink-0 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Organizations</h1>
            <p className="text-sm text-gray-500">All ({orgs?.length ?? 0})</p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => createModal.open()}
              className="inline-flex items-center gap-2 bg-[#F4622A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#E05520] transition"
            >
              <Plus className="w-4 h-4" />Add Organization
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchDropdown
            value={search.q}
            onChange={(q) => navigate({ search: { q }, replace: true })}
            onSelect={(item) => navigate({ to: '/orgs/$orgId', params: { orgId: item.id } })}
            suggestions={filtered.map((o) => ({ id: o.id, label: o.name }))}
            placeholder="Search by name..."
            className="min-w-[220px]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 min-h-0">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="p-5">
            <ErrorMessage message="Failed to load organizations." />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  {['S.No', 'Name', 'Created On', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((org, i) => (
                  <tr key={org.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs">{String(i + 1).padStart(2, '0')}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800 whitespace-nowrap">{org.name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(org.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          to="/orgs/$orgId"
                          params={{ orgId: org.id }}
                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition inline-flex"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        {isSuperAdmin && (
                          <button
                            onClick={() => { setDeleteError(''); deleteModal.open(org) }}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      No organizations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Add Organization" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter organization name"
            required
          />
          <Input
            label="Slug (optional)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="e.g. my-org"
          />
          <div className="sticky bottom-0 -mx-5 -mb-4 px-5 pb-4 pt-3 bg-white border-t border-gray-100 flex justify-end gap-3 mt-4 z-10">
            <Button type="button" variant="outline" onClick={createModal.close}>Cancel</Button>
            <Button type="submit" loading={createOrg.isPending}>Submit</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => { deleteModal.close(); setDeleteError('') }}
        onConfirm={async () => {
          if (deleteModal.data) {
            setDeleteError('')
            try {
              await deleteOrg.mutateAsync(deleteModal.data.id)
              deleteModal.close()
            } catch (err: any) {
              setDeleteError(err?.message ?? 'Failed to delete organization.')
            }
          }
        }}
        loading={deleteOrg.isPending}
        message={`Delete organization "${deleteModal.data?.name}"? This will also remove all associated members.`}
        error={deleteError}
      />
    </div>
  )
}
