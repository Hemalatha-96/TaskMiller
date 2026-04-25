import { InboxIcon } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  message?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({ title = 'No results found', message = 'There is nothing here yet.', icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-gray-300">
        {icon ?? <InboxIcon className="w-12 h-12" />}
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">{message}</p>
      {action}
    </div>
  )
}
