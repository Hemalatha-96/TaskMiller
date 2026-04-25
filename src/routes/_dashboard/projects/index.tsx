import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useProjects, useDeleteProject } from '../../../lib/queries/projects.queries'
import { ProjectList } from '../../../components/projects/ProjectList'
import { ProjectForm } from '../../../components/projects/ProjectForm'
import { ConfirmDeleteModal } from '../../../components/common/ConfirmDeleteModal'
import { SearchDropdown } from '../../../components/common/SearchDropdown'
import { Modal } from '../../../components/ui/modal'
import { Pagination } from '../../../components/ui/Pagination'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { useModal } from '../../../hooks/useModal'
import { useDebounce } from '../../../hooks/useDebounce'
import { PROJECT_STATUS_OPTIONS } from '../../../constants/enums'
import { useAuth } from '../../../hooks/useAuth'
import { useOrgStore } from '../../../store/org.store'
import type { Project } from '../../../types/project.types'

export const Route = createFileRoute('/_dashboard/projects/')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || '',
    status: (search.status as string) || '',
    page: Number(search.page) || 1,
  }),
  component: ProjectsPage,
})

const PAGE_SIZE = 20

function ProjectsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [deleteError, setDeleteError] = useState('')
  const { orgId, isSuperAdmin, isAdmin } = useAuth()
  const { activeOrgId } = useOrgStore()

  const debouncedQ = useDebounce(search.q, 400)
  const effectiveOrgId = isSuperAdmin ? (activeOrgId ?? undefined) : (orgId ?? undefined)

  const { data, isLoading } = useProjects({
    search: debouncedQ || undefined,
    status: search.status || undefined,
    page: search.page,
    limit: PAGE_SIZE,
    orgId: effectiveOrgId,
  })
  const deleteProject = useDeleteProject()
  const createModal = useModal()
  const editModal = useModal<Project>()
  const deleteModal = useModal<Project>()

  const projects = data?.data ?? []

  const setFilter = (updates: Partial<typeof search>) => {
    navigate({ search: (prev) => ({ ...prev, ...updates, page: 1 }), replace: true })
  }

  const setPage = (page: number) => {
    navigate({ search: (prev) => ({ ...prev, page }), replace: true })
  }

  const handleDelete = async () => {
    if (!deleteModal.data) return
    setDeleteError('')
    try {
      await deleteProject.mutateAsync(deleteModal.data.id)
      deleteModal.close()
    } catch (err: any) {
      setDeleteError(err?.message ?? 'Failed to delete project.')
    }
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      <div className="flex-shrink-0 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-500">
              {debouncedQ ? `${data?.total ?? 0} result${(data?.total ?? 0) !== 1 ? 's' : ''} found` : `All (${data?.total ?? 0})`}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => createModal.open()}
              className="inline-flex items-center gap-2 bg-[#F4622A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#E05520] transition"
            >
              <Plus className="w-4 h-4" />Add Project
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <SearchDropdown
            value={search.q}
            onChange={(q) => setFilter({ q })}
            onSelect={(item) => navigate({ to: '/projects/$projectId', params: { projectId: item.id } })}
            suggestions={projects.map((p) => ({ id: p.id, label: p.title, subtitle: p.orgName ?? p.description ?? undefined }))}
            placeholder="Search by name or description..."
            className="min-w-[240px]"
          />
          <select
            value={search.status}
            onChange={(e) => setFilter({ status: e.target.value })}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#F4622A]"
          >
            <option value="">All Statuses</option>
            {PROJECT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 min-h-0">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            <ProjectList
              projects={projects}
              onEdit={editModal.open}
              onDelete={deleteModal.open}
            />
          </div>
        )}

        <div className="flex-shrink-0">
          <Pagination
            page={search.page}
            totalPages={data?.totalPages ?? 1}
            total={data?.total ?? 0}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Add Project" size="md">
        <ProjectForm onSuccess={createModal.close} onCancel={createModal.close} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Edit Project" size="md">
        {editModal.data && (
          <ProjectForm
            initial={editModal.data}
            onSuccess={editModal.close}
            onCancel={editModal.close}
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => { deleteModal.close(); setDeleteError('') }}
        onConfirm={handleDelete}
        loading={deleteProject.isPending}
        message={`Are you sure you want to delete "${deleteModal.data?.title}"? This will also delete all associated tasks.`}
        error={deleteError}
      />
    </div>
  )
}
