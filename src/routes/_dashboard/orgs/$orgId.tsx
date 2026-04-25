import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronLeft, Plus, Trash2, UserCheck, Eye } from 'lucide-react'
import {
  useOrg,
  useOrgMembers,
  useOrgProjects,
  useAssignOrgAdmin,
  useAddOrgDeveloper,
  useRemoveOrgMember,
  useDeleteOrg,
} from '../../../lib/queries/orgs.queries'
import { useUsers } from '../../../lib/queries/users.queries'
import { Avatar } from '../../../components/ui/avatar'
import { Modal } from '../../../components/ui/modal'
import { Button } from '../../../components/ui/button'
import { ConfirmDeleteModal } from '../../../components/common/ConfirmDeleteModal'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { ErrorMessage } from '../../../components/common/ErrorMessage'
import { useModal } from '../../../hooks/useModal'
import { useAuth } from '../../../hooks/useAuth'
import { formatDate } from '../../../utils/date'
import { getProjectStatusColor } from '../../../utils/status'
import { PROJECT_STATUS_LABELS } from '../../../constants/enums'
import { cn } from '../../../utils/cn'
import type { OrgMember } from '../../../types/org.types'

export const Route = createFileRoute('/_dashboard/orgs/$orgId')({
  component: OrgDetailPage,
})

function OrgDetailPage() {
  const { orgId } = Route.useParams()
  const navigate = useNavigate()
  const { isSuperAdmin } = useAuth()

  const { data: org, isLoading: orgLoading, error: orgError } = useOrg(orgId)
  const { data: members, isLoading: membersLoading, error: membersError } = useOrgMembers(orgId)
  const { data: projectsData, isLoading: projectsLoading, error: projectsError } = useOrgProjects(orgId)

  const assignAdmin = useAssignOrgAdmin(orgId)
  const addDeveloper = useAddOrgDeveloper(orgId)
  const removeMember = useRemoveOrgMember(orgId)
  const deleteOrg = useDeleteOrg()

  // Fetch all users across all pages for the dropdowns
  const { data: usersPage1 } = useUsers({ limit: 100, page: 1 })
  const { data: usersPage2 } = useUsers({ limit: 100, page: 2 })
  const allUsers = [
    ...(usersPage1?.data ?? []),
    ...(usersPage2?.data ?? []),
  ]

  const addAdminModal = useModal()
  const addDeveloperModal = useModal()
  const removeMemberModal = useModal<OrgMember>()
  const deleteOrgModal = useModal()

  const [selectedUserId, setSelectedUserId] = useState('')
  const [actionError, setActionError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const projects = projectsData?.data ?? []
  const memberUserIds = new Set((members ?? []).map((m) => m.userId))

  // For Assign Admin: show all users (including current members — to promote them)
  // For Add Developer: show only users NOT yet in this org
  const usersForAdmin = allUsers
  const usersForDeveloper = allUsers.filter((u) => !memberUserIds.has(u.id))

  if (orgLoading || membersLoading) return <LoadingSpinner />
  if (orgError || !org) return <ErrorMessage message="Organization not found." />

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return
    setActionError('')
    try {
      await assignAdmin.mutateAsync(selectedUserId)
      addAdminModal.close()
      setSelectedUserId('')
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to assign admin.')
    }
  }

  const handleAddDeveloper = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return
    setActionError('')
    try {
      await addDeveloper.mutateAsync(selectedUserId)
      addDeveloperModal.close()
      setSelectedUserId('')
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to add developer.')
    }
  }

  const handleDeleteOrg = async () => {
    setDeleteError('')
    try {
      await deleteOrg.mutateAsync(orgId)
      navigate({ to: '/orgs', search: { q: '' } })
    } catch (err: any) {
      setDeleteError(err?.message ?? 'Failed to delete organization.')
    }
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/orgs" search={{ q: '' }} className="flex items-center gap-1 hover:text-[#F4622A] transition">
            <ChevronLeft className="w-4 h-4" />
            Organizations
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{org.name}</span>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => { setDeleteError(''); deleteOrgModal.open() }}
            className="inline-flex items-center gap-1.5 text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />Delete Organization
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-base font-bold text-gray-900">{org.name}</h1>
          <p className="text-sm text-gray-500">{org.description ?? '—'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Created On', value: formatDate(org.createdAt), color: 'text-blue-600 bg-blue-50' },
            { label: 'Members', value: members?.length ?? 0, color: 'text-purple-600 bg-purple-50' },
            { label: 'Projects', value: projects.length, color: 'text-green-600 bg-green-50' },
          ].map(({ label, value, color }) => (
            <div key={label} className={cn('rounded-lg p-2.5 text-center', color)}>
              <div className="text-sm font-bold">{value}</div>
              <div className="text-xs font-medium opacity-70 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Members Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Members</h2>
                <span className="text-sm text-gray-500">({members?.length ?? 0})</span>
              </div>
              {isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedUserId(''); setActionError(''); addAdminModal.open() }}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" />Assign Admin
                  </button>
                  <button
                    onClick={() => { setSelectedUserId(''); setActionError(''); addDeveloperModal.open() }}
                    className="inline-flex items-center gap-1.5 text-xs text-[#F4622A] border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />Add Developer
                  </button>
                </div>
              )}
            </div>

            {membersError ? (
              <ErrorMessage message="Failed to load organization members." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['S.No', 'Name', 'Email', 'Role', 'Joined On', ...(isSuperAdmin ? ['Actions'] : [])].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(members ?? []).map((m, i) => (
                      <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 text-xs">{String(i + 1).padStart(2, '0')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={m.name} src={m.avatar} size="sm" />
                            <span className="font-medium text-gray-800 whitespace-nowrap">{m.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[240px] truncate">{m.email}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', m.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-600')}>
                            {m.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(m.joinedAt)}</td>
                        {isSuperAdmin && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => removeMemberModal.open(m)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition inline-flex"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {(members ?? []).length === 0 && (
                      <tr>
                        <td colSpan={isSuperAdmin ? 6 : 5} className="px-4 py-8 text-center text-sm text-gray-500">No members found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Projects</h2>
              <span className="text-sm text-gray-500">({projects.length})</span>
            </div>

            {projectsLoading ? (
              <LoadingSpinner />
            ) : projectsError ? (
              <ErrorMessage message="Failed to load organization projects." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['S.No', 'Project', 'Status', 'Created On', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {projects.map((p, i) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 text-xs">{String(i + 1).padStart(2, '0')}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-800 whitespace-nowrap">{p.title}</span>
                          {p.description && <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{p.description}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getProjectStatusColor(p.status))}>
                            {PROJECT_STATUS_LABELS[p.status]}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Link
                            to="/projects/$projectId"
                            params={{ projectId: p.id }}
                            className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition inline-flex"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {projects.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">No projects found for this organization.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Admin Modal */}
      <Modal isOpen={addAdminModal.isOpen} onClose={addAdminModal.close} title="Assign Admin" size="sm">
        <form onSubmit={handleAssignAdmin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#F4622A]"
            >
              <option value="">Choose a user...</option>
              {usersForAdmin.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          {actionError && <p className="text-xs text-red-500">{actionError}</p>}
          <div className="sticky bottom-0 -mx-5 -mb-4 px-5 pb-4 pt-3 bg-white border-t border-gray-100 flex justify-end gap-3 mt-4 z-10">
            <Button type="button" variant="outline" onClick={addAdminModal.close}>Cancel</Button>
            <Button type="submit" loading={assignAdmin.isPending}>Assign</Button>
          </div>
        </form>
      </Modal>

      {/* Add Developer Modal */}
      <Modal isOpen={addDeveloperModal.isOpen} onClose={addDeveloperModal.close} title="Add Developer" size="sm">
        <form onSubmit={handleAddDeveloper} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#F4622A]"
            >
              <option value="">Choose a user...</option>
              {usersForDeveloper.length > 0 ? usersForDeveloper.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              )) : (
                <option disabled value="">All users are already members</option>
              )}
            </select>
          </div>
          {actionError && <p className="text-xs text-red-500">{actionError}</p>}
          <div className="sticky bottom-0 -mx-5 -mb-4 px-5 pb-4 pt-3 bg-white border-t border-gray-100 flex justify-end gap-3 mt-4 z-10">
            <Button type="button" variant="outline" onClick={addDeveloperModal.close}>Cancel</Button>
            <Button type="submit" loading={addDeveloper.isPending} disabled={usersForDeveloper.length === 0}>Add</Button>
          </div>
        </form>
      </Modal>

      {/* Remove Member Confirm */}
      <ConfirmDeleteModal
        isOpen={removeMemberModal.isOpen}
        onClose={removeMemberModal.close}
        onConfirm={async () => {
          if (removeMemberModal.data) {
            try {
              await removeMember.mutateAsync(removeMemberModal.data.userId)
              removeMemberModal.close()
            } catch {
              // mutation error handled by React Query
            }
          }
        }}
        loading={removeMember.isPending}
        message={`Remove "${removeMemberModal.data?.name}" from this organization?`}
      />

      {/* Delete Org Confirm */}
      <ConfirmDeleteModal
        isOpen={deleteOrgModal.isOpen}
        onClose={deleteOrgModal.close}
        onConfirm={handleDeleteOrg}
        loading={deleteOrg.isPending}
        message={`Delete organization "${org.name}"? This action cannot be undone.`}
        error={deleteError}
      />
      </div>
    </div>
  )
}
