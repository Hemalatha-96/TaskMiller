import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useTask } from '../../../../queries/tasks.queries'
import TaskForm from '../../../../components/tasks/TaskForm'
import { FormSkeleton } from '../../../../components/ui/Skeleton'
import ErrorMessage from '../../../../components/common/ErrorMessage'
import type { ApiError } from '../../../../types/api.types'

export const Route = createFileRoute('/_dashboard/tasks/$taskId_/edit')({
  component: EditTaskPage,
})

function EditTaskPage() {
  const { taskId } = Route.useParams()
  const navigate   = useNavigate()
  const { data: task, isLoading, isError, error } = useTask(taskId)
  const onBack = () => navigate({ to: '/tasks/$taskId', params: { taskId } })

  if (isLoading) return <FormSkeleton />

  if (isError || !task) return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft size={15} /> Back to Task
      </button>
      <ErrorMessage message={(error as ApiError)?.message ?? 'Task not found'} />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft size={15} /> Back to Task
      </button>
      <TaskForm task={task} onClose={onBack} />
    </div>
  )
}
