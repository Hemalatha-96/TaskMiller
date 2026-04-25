export type TaskStatus = 'to_do' | 'in_progress' | 'on_hold' | 'completed' | 'overdue'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskAssignee {
  id: string
  userId: string
  name: string
  avatar?: string
  role: string
}

export interface TaskComment {
  id: string
  userId: string
  userName: string
  avatar?: string
  text: string
  createdAt: string
  replies?: TaskComment[]
}

export interface Task {
  id: string
  name: string
  description: string
  projectId: string
  projectName: string
  status: TaskStatus
  priority: TaskPriority
  tags: string[]
  assignees: TaskAssignee[]
  dueDate: string
  createdAt: string
  createdById: string
  createdByName: string
  comments: TaskComment[]
  subtasks: SubTask[]
  attachments: number
}

export interface SubTask {
  id: string
  name: string
  completed: boolean
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string
  assignees?: TaskAssignee[]
}
