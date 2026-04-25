import { Link } from '@tanstack/react-router'
import { Calendar, Paperclip } from 'lucide-react'
import { AvatarGroup } from '../ui/avatar'
import { TaskPriorityBadge } from './TaskPriorityBadge'
import { getTaskStatusColor } from '../../utils/status'
import { TASK_STATUS_LABELS } from '../../constants/enums'
import { formatDate, isOverdue } from '../../utils/date'
import { cn } from '../../utils/cn'
import type { Task } from '../../types/task.types'

export function TaskCard({ task }: { task: Task }) {
  return (
    <Link to="/tasks/$taskId" params={{ taskId: task.id }} className="block group">
      <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-orange-200 transition-all">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-gray-800 group-hover:text-[#F4622A] transition-colors line-clamp-2">{task.name}</h3>
          <TaskPriorityBadge priority={task.priority} />
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
        <div className="flex items-center justify-between">
          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getTaskStatusColor(task.status))}>
            {TASK_STATUS_LABELS[task.status]}
          </span>
          <div className={cn('flex items-center gap-1 text-xs', isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-500' : 'text-gray-400')}>
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(task.dueDate)}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <AvatarGroup names={task.assignees.map((a) => a.name)} max={3} size="xs" />
          {task.attachments > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Paperclip className="w-3.5 h-3.5" />
              {task.attachments}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
