import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import TaskForm from '../../../components/tasks/TaskForm'

export const Route = createFileRoute('/_dashboard/tasks/new')({
  component: NewTaskPage,
})

function NewTaskPage() {
  const navigate = useNavigate()
  const onBack = () => navigate({ to: '/tasks', search: {} as any })

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Tasks
      </button>
      <TaskForm onClose={onBack} />
    </div>
  )
}
