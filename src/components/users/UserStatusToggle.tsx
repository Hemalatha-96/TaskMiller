import { useToggleUserStatus } from '../../lib/queries/users.queries'
import { cn } from '../../utils/cn'

interface UserStatusToggleProps {
  userId: string
  status: 'active' | 'inactive'
}

export function UserStatusToggle({ userId, status }: UserStatusToggleProps) {
  const toggle = useToggleUserStatus()
  const nextStatus = status === 'active' ? 'inactive' : 'active'
  return (
    <button
      onClick={() => toggle.mutate({ id: userId, status: nextStatus })}
      disabled={toggle.isPending}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all',
        status === 'active'
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-red-100 text-red-700 hover:bg-red-200',
      )}
    >
      {status === 'active' ? 'Active' : 'Inactive'}
    </button>
  )
}
