export type ProjectStatus = 'active' | 'on_hold' | 'completed'

export interface ProjectMember {
  id:                 string
  name:               string
  email:              string
  avatarUrl:          string | null
  totalTasksAssigned: number
}

export interface ProjectTaskStats {
  total:      number
  pending:    number
  inProgress: number
  onHold:     number
  overdue:    number
  completed:  number
}

export interface ProjectCreator {
  id:        string
  name:      string
  email:     string
  avatarUrl: string | null
}

export interface Project {
  id:          string
  orgId:       string
  title:       string
  description: string | null
  logoUrl:     string | null
  status:      ProjectStatus
  createdBy:   string
  completedAt: string | null
  createdAt:   string
  updatedAt:   string
  deletedAt:   string | null
  members:     ProjectMember[]
  creator:     ProjectCreator
}

export interface ProjectDetail extends Project {
  taskStats: ProjectTaskStats
}

export interface ProjectsPagination {
  currentPage:  number
  limit:        number
  totalRecords: number
  totalPages:   number
  hasNextPage:  boolean
  hasPrevPage:  boolean
}

export interface ProjectsResponse {
  projects:   Project[]
  pagination: ProjectsPagination
}

export interface ProjectsParams {
  search?: string
  status?: ProjectStatus
  orgId?:  string
  page?:   number
  limit?:  number
}

export interface CreateProjectBody {
  title:             string
  description?:      string
  orgId:             string
  assignedUserIds?:  string[]
  logoUrl?:          string
}

export interface UpdateProjectBody {
  title?:       string
  description?: string
  status?:      ProjectStatus
  logoUrl?:     string
}
