import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useProject } from '../../../../queries/projects.queries'
import ProjectForm from '../../../../components/projects/ProjectForm'
import { FormSkeleton } from '../../../../components/ui/Skeleton'
import ErrorMessage from '../../../../components/common/ErrorMessage'
import type { ApiError } from '../../../../types/api.types'

export const Route = createFileRoute('/_dashboard/projects/$projectId_/edit')({
  component: EditProjectPage,
})

function EditProjectPage() {
  const { projectId } = Route.useParams()
  const navigate      = useNavigate()
  const { data: project, isLoading, isError, error } = useProject(projectId)
  const onBack = () => navigate({ to: '/projects/$projectId', params: { projectId }, search: {} as any })

  if (isLoading) return <FormSkeleton />

  if (isError || !project) return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
        <ArrowLeft size={15} /> Back to Project
      </button>
      <ErrorMessage message={(error as ApiError)?.message ?? 'Project not found'} />
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto min-h-0 pb-12 -mx-6 px-6">
      <div className="max-w-2xl mx-auto w-full space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
          <ArrowLeft size={15} /> Back to Project
        </button>
        <ProjectForm project={project} onClose={onBack} />
      </div>
    </div>
  )
}
