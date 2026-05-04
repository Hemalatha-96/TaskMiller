export type TaskStatus   = 'to_do' | 'in_progress' | 'on_hold' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// ─── Shared user shape returned inside tasks ──────────────────────────────────

export interface TaskUser {
  id:        string
  name:      string
  email:     string
  avatarUrl: string | null
}

// ─── Subtask (task with a parentTaskId) ──────────────────────────────────────

export interface Subtask {
  id:           string
  projectId:    string
  parentTaskId: string
  title:        string
  description:  string | null
  status:       TaskStatus
  priority:     TaskPriority
  dueDate:      string | null
  createdBy:    string
  completedAt:  string | null
  createdAt:    string
  updatedAt:    string
  deletedAt:    string | null
  assignees:    TaskUser[]
}

// ─── Task (list item — no subtasks array) ────────────────────────────────────

export interface Task {
  id:           string
  projectId:    string
  parentTaskId: string | null
  title:        string
  description:  string | null
  status:       TaskStatus
  priority:     TaskPriority
  dueDate:      string | null
  createdBy:    string
  completedAt:  string | null
  createdAt:    string
  updatedAt:    string
  deletedAt:    string | null
  assignees:    TaskUser[]
  creator:      TaskUser
}

// ─── Task detail (GET /api/tasks/:id — includes subtasks) ────────────────────

export interface TaskDetail extends Task {
  subtasks: Subtask[]
}

// ─── Paginated list response ──────────────────────────────────────────────────

export interface TasksPagination {
  currentPage:  number
  limit:        number
  totalRecords: number
  totalPages:   number
  hasNextPage:  boolean
  hasPrevPage:  boolean
}

export interface TasksStats {
  total:      number
  todo:       number
  inProgress: number
  onHold:     number
  overdue:    number
  completed:  number
  onTime:     number
  offTime:    number
}

export interface TasksResponse {
  tasks:      Task[]
  stats:      TasksStats
  pagination: TasksPagination
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface TasksParams {
  search?:         string
  status?:         TaskStatus
  priority?:       TaskPriority
  projectId?:      string
  orgId?:          string
  assignedUserId?: string
  dueDateFrom?:    string
  dueDateTo?:      string
  sortBy?:         string
  sortOrder?:      'asc' | 'desc'
  page?:           number
  limit?:          number
}

// ─── Request bodies ───────────────────────────────────────────────────────────

export interface CreateTaskBody {
  title:            string
  description?:     string
  priority:         TaskPriority
  dueDate?:         string
  projectId:        string
  parentTaskId?:    string
  assignedUserIds?: string[]
}

export interface UpdateTaskBody {
  title?:            string
  description?:      string
  status?:           TaskStatus
  priority?:         TaskPriority
  dueDate?:          string
  assignedUserIds?:  string[]
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export interface Attachment {
  id:         string
  taskId:     string
  uploadedBy: string
  s3Key:      string
  fileName:   string
  mimeType:   string
  fileSize:   number
  createdAt:  string
  uploader:   TaskUser
}

export interface AddAttachmentBody {
  s3Key:    string
  fileName: string
  mimeType: string
  fileSize: number
}

export interface AttachmentsResponse {
  attachments: Attachment[]
  pagination:  TasksPagination
}
