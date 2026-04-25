import type { User, UserStatus } from '../../types/user.types'
import type { PaginatedResponse, PaginationParams } from '../../types/api.types'
import { apiClient } from './client'
import { getApiErrorMessage } from './error'
import { unwrapBackendResponse } from './response'

type ApiUser = {
  id: string
  name: string
  email: string
  role: User['role']
  status: User['status']
  phone: string | null
  avatarUrl: string | null
  createdAt: string
  lastLoginAt?: string | null
  orgId?: string | null
  projectCount?: number | null
  taskCount?: number | null
  inProgressCount?: number | null
  toDoCount?: number | null
}

function normalizeUser(user: ApiUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? '',
    avatar: user.avatarUrl ?? undefined,
    role: user.role,
    status: user.status,
    orgId: user.orgId ?? undefined,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? undefined,
    projects: user.projectCount ?? 0,
    tasks: user.taskCount ?? 0,
    inProgress: user.inProgressCount ?? 0,
    pending: user.toDoCount ?? 0,
    department: undefined,
  }
}

type UsersListResponse = {
  users: ApiUser[]
  pagination: {
    currentPage: number
    limit: number
    totalRecords: number
    totalPages: number
  }
}

export async function getUsers(params: PaginationParams = {}): Promise<PaginatedResponse<User>> {
  const res = await apiClient.get('/api/users', {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      status: params.status,
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc',
      orgId: params.orgId,
    },
  })
  const data = unwrapBackendResponse<UsersListResponse>(res.data)

  return {
    data: [...data.users]
      .sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime())
      .map(normalizeUser),
    total: data.pagination.totalRecords,
    page: data.pagination.currentPage,
    limit: data.pagination.limit,
    totalPages: data.pagination.totalPages,
  }
}

export async function getUserById(id: string): Promise<User> {
  const res = await apiClient.get(`/api/users/${id}`)
  const data = unwrapBackendResponse<ApiUser>(res.data)
  return normalizeUser(data)
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get('/api/users/me')
  const data = unwrapBackendResponse<ApiUser>(res.data)
  return normalizeUser(data)
}

export async function updateMe(data: Partial<User>): Promise<User> {
  const res = await apiClient.patch('/api/users/me', {
    name: data.name,
    phone: data.phone,
    avatar: data.avatar,
  })
  const updated = unwrapBackendResponse<ApiUser>(res.data)
  return normalizeUser(updated)
}

export async function updateUserStatus(input: { id: string; status: UserStatus }): Promise<{ id: string; status: UserStatus }> {
  const res = await apiClient.patch(`/api/users/${input.id}/status`, { status: input.status })
  const data = unwrapBackendResponse<{ id: string; name?: string; status: UserStatus }>(res.data)
  return { id: data.id, status: data.status }
}

export type CreateUserPayload = {
  name: string
  email: string
  password: string
  role: 'admin' | 'developer'
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  try {
    const res = await apiClient.post('/api/users', {
      ...payload,
      name: payload.name.trim(),
      email: payload.email.trim(),
    })
    const data = unwrapBackendResponse<{
      id: string
      name: string
      email: string
      role: ApiUser['role']
      status: ApiUser['status']
    }>(res.data)

    return normalizeUser({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      phone: null,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
      orgId: null,
    })
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/users/${id}`)
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}
