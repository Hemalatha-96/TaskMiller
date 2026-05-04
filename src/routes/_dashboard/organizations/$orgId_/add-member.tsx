import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useOrgs } from '../../../../queries/orgs.queries'
import AddMemberModal from '../../../../components/organizations/AddMemberModal'
import { FormSkeleton } from '../../../../components/ui/Skeleton'

export const Route = createFileRoute('/_dashboard/organizations/$orgId_/add-member')({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: ((s.mode as string) === 'admin' ? 'admin' : 'developer') as 'admin' | 'developer',
  }),
  component: AddMemberPage,
})

function AddMemberPage() {
  const { orgId: slug } = Route.useParams()
  const { mode }        = Route.useSearch()
  const navigate        = useNavigate()
  const { data: orgsData, isLoading } = useOrgs()
  const resolvedId = (orgsData?.organizations ?? []).find((o) => o.slug === slug)?.id ?? ''
  const onBack = () => navigate({ to: '/organizations/$orgId', params: { orgId: slug }, search: {} as any })

  if (isLoading) return <FormSkeleton />

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> Back to Organization
      </button>
      <AddMemberModal mode={mode} orgId={resolvedId} onClose={onBack} />
    </div>
  )
}
