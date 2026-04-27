import axios from 'axios'
import type { PaginatedResponse, PaginationParams } from '../../types/api.types'
import type { Project, ProjectMember, ProjectMemberRole, ProjectStatus } from '../../types/project.types'
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

type ApiProjectMember = {
  id?: string
  userId?: string
  name?: string
  email?: string | null
  avatarUrl?: string | null
  avatar?: string | null
  role?: string | null
  tasksAssigned?: number | null
  tasks_assigned?: number | null
  joinedAt?: string | null
  joined_at?: string | null
  user?: {
    id?: string
    name?: string
    email?: string | null
    avatarUrl?: string | null
    avatar?: string | null
  }
}

type ApiProjectStats = {
  total?: number | null
  todo?: number | null
  inProgress?: number | null
  in_progress?: number | null
  completed?: number | null
  onHold?: number | null
  on_hold?: number | null
}

type ApiProjectCreator = {
  id?: string
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
}

type ApiProject = {
  id: string
  title?: string | null
  name?: string | null
  description?: string | null
  logo?: string | null
  logoUrl?: string | null
  icon?: string | null
  status?: string | null
  orgId?: string | null
  orgName?: string | null
  organizationName?: string | null
  org?: { id?: string; name?: string | null; logo?: string | null }
  createdAt?: string | null
  created_at?: string | null
  createdById?: string | null
  createdByName?: string | null
  createdBy?: string | { id?: string; name?: string | null }
  creator?: ApiProjectCreator | null
  members?: ApiProjectMember[] | null
  taskCount?: number | null
  tasksCount?: number | null
  completedTaskCount?: number | null
  completedTasksCount?: number | null
  stats?: ApiProjectStats | null
}

type ProjectsListPayload =
  | ApiProject[]
  | {
      projects?: ApiProject[]
      data?: ApiProject[]
      items?: ApiProject[]
      results?: ApiProject[]
      pagination?: ApiPagination
      total?: number
      page?: number
      limit?: number
      totalPages?: number
    }

function toProjectStatus(value: unknown): ProjectStatus {
  const v = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  switch (v) {
    case 'active':
      return 'active'
    case 'completed':
      return 'completed'
    case 'on_hold':
    case 'onhold':
      return 'on_hold'
    case 'cancelled':
    case 'canceled':
      return 'cancelled'
    default:
      return 'active'
  }
}

function toProjectMemberRole(value: unknown): ProjectMemberRole {
  const v = String(value ?? '')
    .trim()
    .toLowerCase()

  switch (v) {
    case 'manager':
      return 'manager'
    case 'admin':
      return 'admin'
    case 'user':
      return 'user'
    default:
      return 'user'
  }
}

function normalizeMember(input: ApiProjectMember, index: number): ProjectMember {
  const userId = input.userId ?? input.user?.id ?? input.id ?? `unknown_${index}`
  const id = input.id ?? `member_${userId}_${index}`
  const joinedAt = input.joinedAt ?? input.joined_at ?? new Date().toISOString()

  return {
    id,
    userId,
    name: input.name ?? input.user?.name ?? 'Unknown',
    email: input.email ?? input.user?.email ?? undefined,
    avatar: input.avatarUrl ?? input.avatar ?? input.user?.avatarUrl ?? input.user?.avatar ?? undefined,
    role: toProjectMemberRole(input.role),
    tasksAssigned: input.tasksAssigned ?? input.tasks_assigned ?? 0,
    joinedAt,
  }
}

function normalizeStats(stats: ApiProjectStats | null | undefined, taskCount: number, completedTaskCount: number): Project['stats'] {
  const total = stats?.total ?? taskCount ?? 0
  const completed = stats?.completed ?? completedTaskCount ?? 0
  return {
    total,
    todo: stats?.todo ?? 0,
    inProgress: stats?.inProgress ?? stats?.in_progress ?? 0,
    completed,
    onHold: stats?.onHold ?? stats?.on_hold ?? 0,
  }
}

function normalizeProject(project: ApiProject): Project {
  const nowIso = new Date().toISOString()
  const taskCount = project.taskCount ?? project.tasksCount ?? 0
  const completedTaskCount = project.completedTaskCount ?? project.completedTasksCount ?? 0

  // createdBy can be a UUID string (real API) or an object (legacy)
  const createdById = project.createdById ?? project.creator?.id ?? (typeof project.createdBy === 'string' ? project.createdBy : project.createdBy?.id) ?? 'unknown'
  const createdByName = project.createdByName ?? project.creator?.name ?? (typeof project.createdBy === 'object' ? project.createdBy?.name : null) ?? 'Unknown'

  return {
    id: project.id,
    title: project.title ?? project.name ?? 'Untitled Project',
    description: project.description ?? '',
    logo: project.logoUrl ?? project.logo ?? project.icon ?? undefined,
    orgId: project.orgId ?? project.org?.id ?? undefined,
    orgLogo: project.org?.logo ?? undefined,
    orgName: project.orgName ?? project.organizationName ?? project.org?.name ?? undefined,
    status: toProjectStatus(project.status),
    createdById,
    createdByName,
    createdAt: project.createdAt ?? project.created_at ?? nowIso,
    members: Array.isArray(project.members) ? project.members.map(normalizeMember) : [],
    taskCount,
    completedTaskCount,
    stats: normalizeStats(project.stats, taskCount, completedTaskCount),
  }
}

function coerceListPayload(payload: ProjectsListPayload): Exclude<ProjectsListPayload, ApiProject[]> {
  if (Array.isArray(payload)) return { projects: payload }
  return payload
}

function toPaginatedProjects(payload: ProjectsListPayload, params: PaginationParams): PaginatedResponse<Project> {
  const obj = coerceListPayload(payload)
  const items = [...(obj.projects ?? obj.data ?? obj.items ?? obj.results ?? [])]
    .sort((a, b) => new Date(b.createdAt || b.created_at || Date.now()).getTime() - new Date(a.createdAt || a.created_at || Date.now()).getTime())
  const pagination = obj.pagination

  const total = obj.total ?? pagination?.totalRecords ?? pagination?.total ?? items.length
  const page = obj.page ?? pagination?.currentPage ?? pagination?.page ?? params.page ?? 1
  const limit = obj.limit ?? pagination?.limit ?? params.limit ?? 20
  const totalPages = obj.totalPages ?? pagination?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit)))

  return { data: items.map(normalizeProject), total, page, limit, totalPages }
}

export async function getProjects(params: PaginationParams & { memberId?: string } = {}): Promise<PaginatedResponse<Project>> {
  const res = await apiClient.get('/api/projects', {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      status: params.status || undefined,
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc',
      orgId: params.orgId || undefined,
      memberId: params.memberId || undefined,
    },
  })

  const data = unwrapBackendResponse<ProjectsListPayload>(res.data)
  return toPaginatedProjects(data, params)
}

export async function getProjectById(id: string): Promise<Project> {
  const res = await apiClient.get(`/api/projects/${id}`)
  const data = unwrapBackendResponse<any>(res.data)
  const project = (data?.project ?? data?.data ?? data) as ApiProject
  return normalizeProject(project)
}

export async function createProject(input: Partial<Project> & { assignedUserIds?: string[] }): Promise<Project> {
  const res = await apiClient.post('/api/projects', {
    title: input.title,
    description: input.description,
    logoUrl: input.logo,
    orgId: input.orgId,
    status: input.status,
    assignedUserIds: input.assignedUserIds?.length ? input.assignedUserIds : undefined,
  })

  const data = unwrapBackendResponse<any>(res.data)
  const project = (data?.project ?? data?.data ?? data) as ApiProject
  return normalizeProject(project)
}

export async function updateProject(id: string, input: Partial<Project> & { assignedUserIds?: string[] }): Promise<Project> {
  const payload = {
    title: input.title,
    description: input.description,
    logoUrl: input.logo,
    orgId: input.orgId,
    status: input.status,
    assignedUserIds: input.assignedUserIds,
  }

  try {
    const res = await apiClient.patch(`/api/projects/${id}`, payload)
    const data = unwrapBackendResponse<any>(res.data)
    const project = (data?.project ?? data?.data ?? data) as ApiProject
    return normalizeProject(project)
  } catch (err) {
    if (axios.isAxiosError(err) && err.response && (err.response.status === 404 || err.response.status === 405)) {
      const res = await apiClient.put(`/api/projects/${id}`, payload)
      const data = unwrapBackendResponse<any>(res.data)
      const project = (data?.project ?? data?.data ?? data) as ApiProject
      return normalizeProject(project)
    }
    throw err
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/projects/${id}`)
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}
