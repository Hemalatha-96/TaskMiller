import { get, post, patch, del } from '../client'
import type {
  Task, TaskDetail, TasksResponse, TasksParams,
  CreateTaskBody, UpdateTaskBody,
} from '../../types/task.types'

// ─── GET /api/tasks ───────────────────────────────────────────────────────────

export function getTasksApi(params: TasksParams = {}): Promise<TasksResponse> {
  const query = new URLSearchParams()
  if (params.search)         query.set('search',       params.search)
  if (params.status)         query.set('status',       params.status)
  if (params.priority)       query.set('priority',     params.priority)
  if (params.projectId)      query.set('projectId',    params.projectId)
  if (params.orgId)          query.set('orgId',        params.orgId)
  if (params.assignedUserId) query.set('assignedUserId', params.assignedUserId)
  if (params.dueDateFrom)    query.set('dueDateFrom',  params.dueDateFrom)
  if (params.dueDateTo)      query.set('dueDateTo',    params.dueDateTo)
  if (params.sortBy)         query.set('sortBy',       params.sortBy)
  if (params.sortOrder)      query.set('order',        params.sortOrder)
  if (params.page)           query.set('page',         String(params.page))
  if (params.limit)          query.set('limit',        String(params.limit))
  const qs = query.toString()
  return get<TasksResponse>(qs ? `/api/tasks?${qs}` : '/api/tasks')
}

// ─── GET /api/tasks/:id ───────────────────────────────────────────────────────

export function getTaskApi(id: string): Promise<TaskDetail> {
  return get<TaskDetail>(`/api/tasks/${id}`)
}

// ─── POST /api/tasks ──────────────────────────────────────────────────────────

export function createTaskApi(body: CreateTaskBody): Promise<Task> {
  return post<Task>('/api/tasks', body)
}

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────────────────

export function updateTaskApi(id: string, body: UpdateTaskBody): Promise<Task> {
  return patch<Task>(`/api/tasks/${id}`, body)
}

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────

export function deleteTaskApi(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/api/tasks/${id}`)
}
