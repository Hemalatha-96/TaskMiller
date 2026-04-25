import { cn } from '../../utils/cn'
import { getTaskPriorityColor } from '../../utils/status'
import { TASK_PRIORITY_LABELS } from '../../constants/enums'
import type { TaskPriority } from '../../types/task.types'

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getTaskPriorityColor(priority))}>
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  )
}
