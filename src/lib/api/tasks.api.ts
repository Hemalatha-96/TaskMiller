import type { PaginatedResponse, PaginationParams } from '../../types/api.types'
import type { Task, TaskComment, TaskAssignee, SubTask, TaskPriority, TaskStatus } from '../../types/task.types'
import { apiClient } from './client'
import { getApiErrorMessage } from './error'
import { unwrapBackendResponse } from './response'

type ApiPagination = {
  currentPage?: number
  page?: number
  limit?: number
  totalRecords?: number
  total?: number
  totalPages?: number
}

type ApiTaskAssignee = {
  id?: string
  userId?: string
  name?: string
  avatarUrl?: string | null
  avatar?: string | null
  role?: string
  user?: {
    id?: string
    name?: string
    avatarUrl?: string | null
    avatar?: string | null
  }
}

type ApiTaskComment = {
  id?: string
  userId?: string
  userName?: string
  name?: string
  avatarUrl?: string | null
  avatar?: string | null
  text?: string
  message?: string
  createdAt?: string
  created_at?: string
  replies?: ApiTaskComment[]
}

type ApiSubTask = {
  id?: string
  name?: string
  title?: string
  completed?: boolean
  isCompleted?: boolean
  status?: string | null
  priority?: string | null
  description?: string | null
  dueDate?: string | null
  due_at?: string | null
  assignees?: ApiTaskAssignee[] | null
}

type ApiTaskCreator = {
  id?: string
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
}

type ApiTask = {
  id: string
  name?: string
  title?: string
  description?: string | null
  projectId?: string | null
  projectName?: string | null
  project?: { id?: string; name?: string | null; title?: string | null }
  status?: string | null
  priority?: string | null
  tags?: string[] | null
  assignees?: ApiTaskAssignee[] | null
  dueDate?: string | null
  due_at?: string | null
  createdAt?: string | null
  created_at?: string | null
  createdById?: string | null
  createdByName?: string | null
  createdBy?: string | { id?: string; name?: string | null }
  creator?: ApiTaskCreator | null
  comments?: ApiTaskComment[] | null
  subtasks?: ApiSubTask[] | null
  attachments?: number | unknown[] | null
  attachmentCount?: number | null
}

type TasksListPayload =
  | ApiTask[]
  | {
      tasks?: ApiTask[]
      data?: ApiTask[]
      items?: ApiTask[]
      results?: ApiTask[]
      pagination?: ApiPagination
      total?: number
      page?: number
      limit?: number
      totalPages?: number
    }

function toTaskStatus(value: unknown): TaskStatus {
  const v = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  switch (v) {
    case 'to_do':
    case 'todo':
      return 'to_do'
    case 'overdue':
      return 'overdue'
    case 'in_progress':
    case 'inprogress':
      return 'in_progress'
    case 'on_hold':
    case 'onhold':
      return 'on_hold'
    case 'completed':
    case 'done':
      return 'completed'
    default:
      return 'to_do'
  }
}

function toTaskPriority(value: unknown): TaskPriority {
  const v = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  switch (v) {
    case 'low':
      return 'low'
    case 'medium':
      return 'medium'
    case 'high':
      return 'high'
    case 'urgent':
      return 'urgent'
    default:
      return 'medium'
  }
}

function normalizeAssignee(input: ApiTaskAssignee, index: number): TaskAssignee {
  const userId = input.userId ?? input.user?.id ?? input.id ?? `unknown_${index}`
  const id = input.id ?? `assignee_${userId}_${index}`
  return {
    id,
    userId,
    name: input.name ?? input.user?.name ?? 'Unknown',
    avatar: input.avatarUrl ?? input.avatar ?? input.user?.avatarUrl ?? input.user?.avatar ?? undefined,
    role: input.role ?? 'Member',
  }
}

function normalizeComment(input: ApiTaskComment, index: number): TaskComment {
  const userName = input.userName ?? input.name ?? 'Unknown'
  const createdAt = input.createdAt ?? input.created_at ?? new Date().toISOString()
  return {
    id: input.id ?? `comment_${createdAt}_${index}`,
    userId: input.userId ?? 'unknown',
    userName,
    avatar: input.avatarUrl ?? input.avatar ?? undefined,
    text: input.text ?? input.message ?? '',
    createdAt,
    replies: input.replies?.map((r, i) => normalizeComment(r, i)),
  }
}

function normalizeSubTask(input: ApiSubTask, index: number): SubTask {
  const statusStr = input.status != null ? String(input.status).toLowerCase() : ''
  const isCompleted = input.completed ?? input.isCompleted ?? statusStr === 'completed'
  return {
    id: input.id ?? `subtask_${index}`,
    name: input.name ?? input.title ?? 'Untitled subtask',
    completed: isCompleted,
    description: input.description ?? undefined,
    status: toTaskStatus(input.status),
    priority: toTaskPriority(input.priority),
    dueDate: input.dueDate ?? input.due_at ?? undefined,
    assignees: Array.isArray(input.assignees) ? input.assignees.map(normalizeAssignee) : [],
  }
}

function normalizeTask(task: ApiTask): Task {
  const nowIso = new Date().toISOString()
  const projectId = task.projectId ?? task.project?.id ?? ''
  const projectName = task.projectName ?? task.project?.title ?? task.project?.name ?? ''

  const tags = Array.isArray(task.tags) ? task.tags.filter((t): t is string => typeof t === 'string') : []
  const assignees = Array.isArray(task.assignees) ? task.assignees.map(normalizeAssignee) : []
  const comments = Array.isArray(task.comments) ? task.comments.map(normalizeComment) : []
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks.map(normalizeSubTask) : []

  const attachmentsCount =
    typeof task.attachments === 'number'
      ? task.attachments
      : typeof task.attachmentCount === 'number'
        ? task.attachmentCount
        : Array.isArray(task.attachments)
          ? task.attachments.length
          : 0

  // createdBy can be a UUID string (real API) or an object (legacy)
  const createdById = task.createdById ?? task.creator?.id ?? (typeof task.createdBy === 'string' ? task.createdBy : task.createdBy?.id) ?? 'unknown'
  const createdByName = task.createdByName ?? task.creator?.name ?? (typeof task.createdBy === 'object' ? task.createdBy?.name : null) ?? 'Unknown'

  return {
    id: task.id,
    name: task.name ?? task.title ?? 'Untitled Task',
    description: task.description ?? '',
    projectId,
    projectName,
    status: toTaskStatus(task.status),
    priority: toTaskPriority(task.priority),
    tags,
    assignees,
    dueDate: task.dueDate ?? task.due_at ?? nowIso,
    createdAt: task.createdAt ?? task.created_at ?? nowIso,
    createdById,
    createdByName,
    comments,
    subtasks,
    attachments: attachmentsCount,
  }
}

function normalizeDueDateForApi(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  // Extract YYYY-MM-DD from any ISO timestamp or plain date string
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : undefined
}

function coerceListPayload(payload: TasksListPayload): Exclude<TasksListPayload, ApiTask[]> {
  if (Array.isArray(payload)) return { tasks: payload }
  return payload
}

function toPaginatedTasks(payload: TasksListPayload, params: PaginationParams): PaginatedResponse<Task> {
  const obj = coerceListPayload(payload)
  const items = [...(obj.tasks ?? obj.data ?? obj.items ?? obj.results ?? [])]
    .sort((a, b) => new Date(b.createdAt || b.created_at || Date.now()).getTime() - new Date(a.createdAt || a.created_at || Date.now()).getTime())
  const pagination = obj.pagination

  const total = obj.total ?? pagination?.totalRecords ?? pagination?.total ?? items.length
  const page = obj.page ?? pagination?.currentPage ?? pagination?.page ?? params.page ?? 1
  const limit = obj.limit ?? pagination?.limit ?? params.limit ?? items.length ?? 20
  const totalPages = obj.totalPages ?? pagination?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit)))

  return { data: items.map(normalizeTask), total, page, limit, totalPages }
}

export async function getTasks(params: PaginationParams & { projectId?: string; priority?: string; assigneeId?: string } = {}): Promise<PaginatedResponse<Task>> {
  const res = await apiClient.get('/api/tasks', {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      status: params.status || undefined,
      projectId: params.projectId || undefined,
      priority: params.priority || undefined,
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc',
      orgId: params.orgId || undefined,
      assigneeId: params.assigneeId || undefined,
    },
  })

  const data = unwrapBackendResponse<TasksListPayload>(res.data)
  return toPaginatedTasks(data, params)
}

export async function getTaskById(id: string): Promise<Task> {
  const res = await apiClient.get(`/api/tasks/${id}`)
  // Real API: unwraps to the task object directly (not wrapped in task/data key)
  const data = unwrapBackendResponse<any>(res.data)
  const task = (data?.task ?? data?.data ?? (data?.id ? data : null)) as ApiTask
  return normalizeTask(task)
}

export async function createTask(input: Partial<Task> & { assignedUserIds?: string[] }): Promise<Task> {
  try {
    const res = await apiClient.post('/api/tasks', {
      title: input.name,
      description: input.description,
      projectId: input.projectId || undefined,
      status: input.status,
      priority: input.priority,
      tags: input.tags,
      dueDate: normalizeDueDateForApi(input.dueDate),
      assignedUserIds: input.assignedUserIds,
    })

    const data = unwrapBackendResponse<any>(res.data)
    const task = (data?.task ?? data?.data ?? data) as ApiTask
    return normalizeTask(task)
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}

export async function updateTask(id: string, input: Partial<Task>): Promise<Task> {
  try {
    const assignedUserIds = (input as Partial<Task> & { assignedUserIds?: string[] }).assignedUserIds
    const res = await apiClient.patch(`/api/tasks/${id}`, {
      title: input.name,
      description: input.description,
      projectId: input.projectId || undefined,
      status: input.status,
      priority: input.priority,
      tags: input.tags,
      dueDate: normalizeDueDateForApi(input.dueDate),
      assignedUserIds: Array.isArray(assignedUserIds) ? assignedUserIds : undefined,
    })

    const data = unwrapBackendResponse<any>(res.data)
    const task = (data?.task ?? data?.data ?? data) as ApiTask
    return normalizeTask(task)
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  // /api/tasks/:id/status returns 404 on the real API — use PATCH /api/tasks/:id directly
  return updateTask(id, { status })
}

export async function deleteTask(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/tasks/${id}`)
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}

export interface SubTaskInput {
  title: string
  priority?: TaskPriority
  status?: TaskStatus
  dueDate?: string
  projectId?: string
}

export async function createSubTask(parentTaskId: string, input: SubTaskInput): Promise<Task> {
  try {
    const res = await apiClient.post('/api/tasks', {
      title: input.title,
      priority: input.priority ?? 'medium',
      status: input.status ?? 'to_do',
      dueDate: normalizeDueDateForApi(input.dueDate),
      projectId: input.projectId,
      parentTaskId,
    })
    const data = unwrapBackendResponse<any>(res.data)
    const task = (data?.task ?? data?.data ?? data) as ApiTask
    return normalizeTask(task)
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}
