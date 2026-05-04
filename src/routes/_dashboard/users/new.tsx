import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import UserForm from '../../../components/users/UserForm'

export const Route = createFileRoute('/_dashboard/users/new')({
  component: NewUserPage,
})

function NewUserPage() {
  const navigate = useNavigate()
  const onBack = () => navigate({ to: '/users', search: {} as any })

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> Back to Users
      </button>
      <UserForm onClose={onBack} />
    </div>
  )
}
