type Priority = 'low' | 'medium' | 'high' | 'urgent'

const config: Record<Priority, { label: string; bg: string; text: string; border: string }> = {
  urgent: { label: 'Urgent', bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200' },
  high:   { label: 'High',   bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  medium: { label: 'Medium', bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200' },
  low:    { label: 'Low',    bg: 'bg-gray-50',   text: 'text-gray-500',   border: 'border-gray-200' },
}

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const c = config[priority]
  return (
    <span className={`inline-flex justify-center min-w-[70px] px-2.5 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  )
}
