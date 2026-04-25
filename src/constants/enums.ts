import type { TaskStatus, TaskPriority } from '../types/task.types'
import type { ProjectStatus } from '../types/project.types'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  to_do: 'To Do',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  overdue: 'Overdue',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
}

export const TASK_STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const TASK_PRIORITY_OPTIONS = Object.entries(TASK_PRIORITY_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const PROJECT_STATUS_OPTIONS = Object.entries(PROJECT_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const USER_ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  developer: 'Developer',
}

export const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'Finance',
  'HR',
  'Operations',
  'Product',
]
