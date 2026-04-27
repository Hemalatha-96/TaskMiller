import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { useUsers, useCreateUser, useToggleUserStatus } from '../../../lib/queries/users.queries'
import { UserTable } from '../../../components/users/UserTable'
import { SearchDropdown } from '../../../components/common/SearchDropdown'
import { Modal } from '../../../components/ui/modal'
import { Input } from '../../../components/ui/input'
import { Select } from '../../../components/ui/select'
import { Button } from '../../../components/ui/button'
import { Pagination } from '../../../components/ui/Pagination'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { ErrorMessage } from '../../../components/common/ErrorMessage'
import { useModal } from '../../../hooks/useModal'
import { useDebounce } from '../../../hooks/useDebounce'
import { formatDate } from '../../../utils/date'
import { Avatar } from '../../../components/ui/avatar'
import type { User } from '../../../types/user.types'
import { useAuth } from '../../../hooks/useAuth'
import { useOrgStore } from '../../../store/org.store'

export const Route = createFileRoute('/_dashboard/users/')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || undefined,
    status: (search.status as string) || undefined,
    page: Number(search.page) > 1 ? Number(search.page) : undefined,
  }),
  component: UsersPage,
})

const PAGE_SIZE = 20

function UsersPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [createError, setCreateError] = useState('')
  const [editError, setEditError] = useState('')

  const debouncedQ = useDebounce(search.q ?? '', 400)
  const { isSuperAdmin } = useAuth()
  const { activeOrgId } = useOrgStore()

  const effectiveOrgId = isSuperAdmin ? (activeOrgId ?? undefined) : undefined

  const { data, isLoading } = useUsers({ search: debouncedQ || undefined, status: search.status || undefined, page: search.page ?? 1, limit: PAGE_SIZE, orgId: effectiveOrgId })
  const createUser = useCreateUser()
  const toggleStatus = useToggleUserStatus()

  const createModal = useModal()
  const editModal = useModal<User>()

  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'developer' as 'developer' | 'admin' })
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active')

  const users = data?.data ?? []

  const setFilter = (updates: Record<string, string | undefined>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...Object.fromEntries(Object.entries(updates).map(([k, v]) => [k, v === '' ? undefined : v])),
        page: undefined,
      }),
      replace: true,
    })
  }

  const setPage = (page: number) => {
    navigate({ search: (prev) => ({ ...prev, page: page > 1 ? page : undefined }), replace: true })
  }

  useEffect(() => {
    if (editModal.data) setEditStatus(editModal.data.status)
  }, [editModal.data])

  const handleCreate = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreateError('')
    const name = createForm.name.trim()
    const email = createForm.email.trim()
    if (name.length < 2) { setCreateError('Name must be at least 2 characters.'); return }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setCreateError('Please enter a valid email address.'); return }
    if (createForm.password.length < 8) { setCreateError('Password must be at least 8 characters.'); return }
    try {
      await createUser.mutateAsync({ ...createForm, name, email })
      createModal.close()
      setCreateForm({ name: '', email: '', password: '', role: 'developer' })
    } catch (err: any) {
      setCreateError(err.message ?? 'Failed to create user')
    }
  }

  const handleEditSave = async () => {
    if (!editModal.data) return
    setEditError('')
    try {
      await toggleStatus.mutateAsync({ id: editModal.data.id, status: editStatus })
      editModal.close()
    } catch (err: any) {
      setEditError(err.message ?? 'Failed to update user')
    }
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      <div className="flex-shrink-0 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500">
              {debouncedQ ? `${data?.total ?? 0} result${(data?.total ?? 0) !== 1 ? 's' : ''} found` : `All (${data?.total ?? 0})`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCreateError(''); createModal.open() }}
              className="inline-flex items-center gap-2 bg-[#F4622A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#E05520] transition"
            >
              <UserPlus className="w-4 h-4" />Add User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <SearchDropdown
            value={search.q || ''}
            onChange={(q) => setFilter({ q })}
            onSelect={(item) => navigate({ to: '/users/$userId', params: { userId: item.id } })}
            suggestions={users.map((u) => ({ id: u.id, label: u.name, subtitle: u.email }))}
            placeholder="Search by name or email..."
            className="min-w-[220px]"
          />
          <select
            value={search.status || ''}
            onChange={(e) => setFilter({ status: e.target.value })}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#F4622A]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 min-h-0">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto">
            <UserTable
              users={users}
              page={search.page ?? 1}
              pageSize={PAGE_SIZE}
              onEdit={editModal.open}
            />
          </div>
        )}
        <div className="flex-shrink-0">
          <Pagination
            page={search.page ?? 1}
            totalPages={data?.totalPages ?? 1}
            total={data?.total ?? 0}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      </div>

      {/* ── Create Modal ─────────────────────────────────── */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Add User" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && <ErrorMessage message={createError} />}
          <Input
            label="Name"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="Enter user name"
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            placeholder="Enter email address"
            required
          />
          <Input
            label="Password"
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            placeholder="Set a password (min 8 chars)"
            required
          />
          <Select
            label="Role"
            value={createForm.role}
            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'developer' | 'admin' })}
            options={[
              { value: 'developer', label: 'Developer' },
              { value: 'admin', label: 'Admin' },
            ]}
          />
          <div className="sticky bottom-0 -mx-5 -mb-4 px-5 pb-4 pt-3 bg-white border-t border-gray-100 flex justify-end gap-3 mt-4 z-10">
            <Button type="button" variant="outline" onClick={createModal.close}>Cancel</Button>
            <Button type="submit" loading={createUser.isPending}>Create User</Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Modal ───────────────────────────────────── */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Edit User" size="md">
        {editModal.data && (
          <div className="space-y-4">
            {editError && <ErrorMessage message={editError} />}

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar name={editModal.data.name} size="md" />
              <div>
                <p className="font-semibold text-gray-900">{editModal.data.name}</p>
                <p className="text-sm text-gray-500">{editModal.data.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 uppercase font-medium mb-1">Role</p>
                <p className="text-gray-800 font-medium capitalize">{editModal.data.role}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 uppercase font-medium mb-1">Joined</p>
                <p className="text-gray-800 font-medium">{formatDate(editModal.data.createdAt)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 uppercase font-medium mb-1">Mobile</p>
                <p className="text-gray-800 font-medium">{editModal.data.phone || '—'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#F4622A] focus:ring-2 focus:ring-[#F4622A]/20"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="sticky bottom-0 -mx-5 -mb-4 px-5 pb-4 pt-3 bg-white border-t border-gray-100 flex justify-end gap-3 mt-4 z-10">
              <Button type="button" variant="outline" onClick={editModal.close}>Cancel</Button>
              <Button
                type="button"
                onClick={handleEditSave}
                loading={toggleStatus.isPending}
                disabled={editStatus === editModal.data.status}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
