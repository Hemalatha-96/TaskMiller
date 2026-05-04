import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import OrgForm from '../../../../components/organizations/OrgForm'

export const Route = createFileRoute('/_dashboard/superadmin/organizations/new')({
  component: NewOrgPage,
})

function NewOrgPage() {
  const navigate = useNavigate()
  const onBack = () => navigate({ to: '/superadmin/organizations', search: {} as any })

  return (
    <div className="flex-1 overflow-y-auto min-h-0 pb-12 -mx-6 px-6">
      <div className="max-w-2xl mx-auto w-full space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} /> Back to Organizations
        </button>
        <OrgForm onClose={onBack} />
      </div>
    </div>
  )
}
