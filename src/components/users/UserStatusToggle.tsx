import type { UserStatus } from '../../types/user.types'

interface UserStatusToggleProps {
  userId:    string
  status:    UserStatus
  disabled:  boolean
  onToggle:  (id: string, current: UserStatus) => void
}

export default function UserStatusToggle({ userId, status, disabled, onToggle }: UserStatusToggleProps) {
  return (
    <button
      onClick={() => onToggle(userId, status)}
      disabled={disabled}
      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
        status === 'active'
          ? 'border-red-200 text-red-500 hover:bg-red-50'
          : 'border-green-200 text-green-600 hover:bg-green-50'
      }`}
    >
      {status === 'active' ? 'Deactivate' : 'Activate'}
    </button>
  )
}
