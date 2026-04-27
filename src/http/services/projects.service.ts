import { get, post, patch, del } from '../client'
import type {
  Project, ProjectDetail, ProjectsResponse, ProjectsParams,
  CreateProjectBody, UpdateProjectBody,
} from '../../types/project.types'

// ─── GET /api/projects ────────────────────────────────────────────────────────

export function getProjectsApi(params: ProjectsParams = {}): Promise<ProjectsResponse> {
  const query = new URLSearchParams()
  if (params.search) query.set('title',  params.search)
  if (params.status) query.set('status', params.status)
  if (params.orgId)  query.set('orgId',  params.orgId)
  if (params.page)   query.set('page',   String(params.page))
  if (params.limit)  query.set('limit',  String(params.limit))
  const qs = query.toString()
  return get<ProjectsResponse>(qs ? `/api/projects?${qs}` : '/api/projects')
}

// ─── GET /api/projects/:id ────────────────────────────────────────────────────

export function getProjectApi(id: string): Promise<ProjectDetail> {
  return get<ProjectDetail>(`/api/projects/${id}`)
}

// ─── POST /api/projects ───────────────────────────────────────────────────────

export function createProjectApi(body: CreateProjectBody): Promise<Project> {
  return post<Project>('/api/projects', body)
}

// ─── PATCH /api/projects/:id ──────────────────────────────────────────────────

export function updateProjectApi(id: string, body: UpdateProjectBody): Promise<Project> {
  return patch<Project>(`/api/projects/${id}`, body)
}

// ─── DELETE /api/projects/:id ─────────────────────────────────────────────────

export function deleteProjectApi(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/api/projects/${id}`)
}
