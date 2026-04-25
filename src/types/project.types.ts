export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled'
export type ProjectMemberRole = 'manager' | 'admin' | 'user'

export interface ProjectMember {
  id: string
  userId: string
  name: string
  email?: string
  avatar?: string
  role: ProjectMemberRole
  tasksAssigned: number
  joinedAt: string
}

export interface Project {
  id: string
  title: string
  description: string
  logo?: string
  orgId?: string
  orgLogo?: string
  orgName?: string
  status: ProjectStatus
  createdById: string
  createdByName: string
  createdAt: string
  members: ProjectMember[]
  taskCount: number
  completedTaskCount: number
  stats: {
    total: number
    todo: number
    inProgress: number
    completed: number
    onHold: number
  }
}
