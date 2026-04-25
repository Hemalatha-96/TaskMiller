import { cn } from '../../utils/cn'
import { getTaskStatusColor, getAllowedStatuses, getEffectiveStatus } from '../../utils/status'
import { TASK_STATUS_LABELS } from '../../constants/enums'
import type { TaskStatus } from '../../types/task.types'

interface TaskStatusSelectProps {
  value: TaskStatus
  onChange: (value: TaskStatus) => void
  disabled?: boolean
  dueDate?: string
}

export function TaskStatusSelect({ value, onChange, disabled, dueDate }: TaskStatusSelectProps) {
  const effective = getEffectiveStatus(value, dueDate)
  const allowedStatuses = getAllowedStatuses(effective)

  if (allowedStatuses.length === 0) {
    return (
      <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', getTaskStatusColor(effective))}>
        {TASK_STATUS_LABELS[effective]}
      </span>
    )
  }

  return (
    <select
      value={effective}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      disabled={disabled}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#F4622A]/30',
        getTaskStatusColor(effective),
      )}
    >
      <option value={effective}>{TASK_STATUS_LABELS[effective]}</option>
      {allowedStatuses.map((opt) => (
        <option key={opt} value={opt}>{TASK_STATUS_LABELS[opt]}</option>
      ))}
    </select>
  )
}
