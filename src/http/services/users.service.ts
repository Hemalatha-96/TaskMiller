import { get, post, patch } from '../client'
import type {
  User, UserDetail, UsersParams, UsersResponse,
  CreateUserBody, UpdateMeBody,
} from '../../types/user.types'

// ─── GET /api/users ───────────────────────────────────────────────────────────

export function getUsersApi(params: UsersParams = {}): Promise<UsersResponse> {
  const query = new URLSearchParams()
  if (params.search)     query.set('name',       params.search)
  if (params.status)     query.set('status',     params.status)
  if (params.role)       query.set('role',       params.role)
  if (params.orgId)      query.set('orgId',      params.orgId)
  if (params.sortBy)     query.set('sortBy',     params.sortBy)
  if (params.sortOrder)  query.set('order',      params.sortOrder)
  if (params.page)       query.set('page',       String(params.page))
  if (params.limit)      query.set('limit',      String(params.limit))
  if (params.unassigned) query.set('unassigned', 'true')
  const qs   = query.toString()
  const path = qs ? `/api/users?${qs}` : '/api/users'
  return get<UsersResponse>(path)
}

// ─── GET /api/users/me ────────────────────────────────────────────────────────

export function getMeApi(): Promise<UserDetail> {
  return get<UserDetail>('/api/users/me')
}

// ─── GET /api/users/:id ───────────────────────────────────────────────────────

export function getUserApi(id: string): Promise<UserDetail> {
  return get<UserDetail>(`/api/users/${id}`)
}

// ─── POST /api/users ──────────────────────────────────────────────────────────

export function createUserApi(body: CreateUserBody): Promise<User> {
  return post<User>('/api/users', body)
}

// ─── PATCH /api/users/me ──────────────────────────────────────────────────────

export function updateMeApi(body: UpdateMeBody): Promise<UserDetail> {
  return patch<UserDetail>('/api/users/me', body)
}

// ─── PATCH /api/users/:id/status ─────────────────────────────────────────────

export function toggleUserStatusApi(
  id: string,
  status: 'active' | 'inactive',
): Promise<{ id: string; name: string; status: string }> {
  return patch(`/api/users/${id}/status`, { status })
}
