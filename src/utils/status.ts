import type { TaskStatus, TaskPriority } from '../types/task.types'
import type { ProjectStatus } from '../types/project.types'
import { isOverdue } from './date'

export function getTaskStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'to_do':
      return 'bg-gray-100 text-gray-600'
    case 'in_progress':
      return 'bg-blue-100 text-blue-700'
    case 'on_hold':
      return 'bg-orange-100 text-orange-700'
    case 'completed':
      return 'bg-green-100 text-green-700'
    case 'overdue':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

// Returns the status to DISPLAY (overdue when past due date and not completed)
export function getEffectiveStatus(status: TaskStatus, dueDate?: string): TaskStatus {
  if (status === 'completed' || status === 'overdue') return status
  if (dueDate && isOverdue(dueDate)) return 'overdue'
  return status
}

// Returns allowed next statuses based on current/effective status
export function getAllowedStatuses(current: TaskStatus): TaskStatus[] {
  switch (current) {
    case 'completed': return []
    case 'overdue': return ['completed']
    case 'on_hold': return ['completed']
    case 'in_progress': return ['on_hold', 'completed']
    case 'to_do': return ['in_progress', 'on_hold', 'completed']
    default: return []
  }
}

export function getTaskPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case 'low':
      return 'bg-blue-100 text-blue-700'
    case 'medium':
      return 'bg-yellow-100 text-yellow-700'
    case 'high':
      return 'bg-orange-100 text-orange-700'
    case 'urgent':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export function getProjectStatusColor(status: ProjectStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700'
    case 'completed':
      return 'bg-blue-100 text-blue-700'
    case 'on_hold':
      return 'bg-orange-100 text-orange-700'
    case 'cancelled':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export function getUserStatusColor(status: string): string {
  return status === 'active'
    ? 'bg-green-100 text-green-700'
    : 'bg-red-100 text-red-700'
}

export function labelify(str: string): string {
  return str
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
