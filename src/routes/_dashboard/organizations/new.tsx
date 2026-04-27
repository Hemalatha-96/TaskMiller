import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import OrgForm from '../../../components/organizations/OrgForm'

export const Route = createFileRoute('/_dashboard/organizations/new')({
  component: NewOrgPage,
})

function NewOrgPage() {
  const navigate = useNavigate()
  const onBack = () => navigate({ to: '/organizations', search: {} as any })

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Organizations
      </button>
      <OrgForm onClose={onBack} />
    </div>
  )
}
