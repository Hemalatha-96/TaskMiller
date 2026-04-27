export type UserRole   = 'superadmin' | 'admin' | 'developer'
export type UserStatus = 'active' | 'inactive'

// ─── Core user shape (list items) ────────────────────────────────────────────

export interface User {
  id:              string
  name:            string
  email:           string
  role:            UserRole
  status:          UserStatus
  phone:           string | null
  avatarUrl:       string | null
  lastLoginAt:     string | null
  createdAt:       string
  projectCount:    number
  taskCount:       number
  inProgressCount: number
  toDoCount:       number
}

// ─── Full user (GET /me, GET /:id) ───────────────────────────────────────────

export interface UserStats {
  totalProjects: number
  totalTasks:    number
  completed:     number
  pending:       number
  inProgress:    number
  onHold:        number
  overdue:       number
  onTime:        number
  offTime:       number
}

export interface UserProjectTask {
  id:          string
  title:       string
  status:      string
  priority:    string
  dueDate:     string | null
  projectId:   string
  completedAt: string | null
  createdAt:   string
  assignees?:  { id: string; name: string; email: string; avatarUrl?: string | null }[]
}

export interface UserProject {
  id:          string
  title:       string
  description: string | null
  logoUrl:     string | null
  status:      string
  createdAt:   string
  tasks:       UserProjectTask[]
}

export interface UserDetail extends User {
  updatedAt: string
  orgId?:    string | null
  orgName?:  string | null
  stats?:    UserStats
  projects?: UserProject[]
}

// ─── List response ────────────────────────────────────────────────────────────

export interface UsersPagination {
  currentPage:  number
  limit:        number
  totalRecords: number
  totalPages:   number
  hasNextPage:  boolean
  hasPrevPage:  boolean
}

export interface UsersResponse {
  users:      User[]
  pagination: UsersPagination
}

// ─── Request bodies ───────────────────────────────────────────────────────────

export interface UsersParams {
  search?:     string
  status?:     UserStatus
  role?:       UserRole
  orgId?:      string
  sortBy?:     string
  sortOrder?:  'asc' | 'desc'
  page?:       number
  limit?:      number
  unassigned?: boolean
}

export interface CreateUserBody {
  name:     string
  email:    string
  password: string
  role:     'admin' | 'developer'
}

export interface UpdateMeBody {
  name?:  string
  phone?: string
  avatarUrl?: string
}
