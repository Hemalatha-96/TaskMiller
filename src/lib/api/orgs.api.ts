import type { Organization, OrgMember } from '../../types/org.types'
import type { PaginatedResponse } from '../../types/api.types'
import type { Project } from '../../types/project.types'
import { apiClient } from './client'
import { unwrapBackendResponse } from './response'
import { getProjects } from './projects.api'

type ApiOrgOwner = {
  id?: string
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
}

type ApiOrganization = {
  id: string
  name: string
  slug: string
  createdAt: string
  description?: string | null
  ownerId?: string | null
  owner?: ApiOrgOwner | null
  memberCount?: number | null
  projectCount?: number | null
}

type ApiOrgMember = {
  memberId?: string
  id?: string
  role?: OrgMember['role']
  joinedAt?: string | null
  joined_at?: string | null
  userId?: string | null
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
  status?: string | null
}

type ApiPagination = {
  currentPage?: number
  page?: number
  limit?: number
  totalRecords?: number
  total?: number
  totalPages?: number
}

type OrgsListPayload =
  | ApiOrganization[]
  | {
      organizations?: ApiOrganization[]
      data?: ApiOrganization[]
      items?: ApiOrganization[]
      pagination?: ApiPagination
      sortBy?: string
      sortOrder?: string
      total?: number
      page?: number
      limit?: number
      totalPages?: number
    }

type OrgDetailResponse = ApiOrganization & {
  members?: ApiOrgMember[]
}

function normalizeOrg(org: ApiOrganization, memberCount?: number): Organization {
  return {
    id: org.id,
    name: org.name,
    logo: undefined,
    description: org.description ?? undefined,
    createdAt: org.createdAt,
    memberCount: memberCount ?? org.memberCount ?? 0,
    projectCount: org.projectCount ?? 0,
  }
}

function normalizeMember(orgId: string, m: ApiOrgMember, index: number): OrgMember {
  const id = m.memberId ?? m.id ?? `member_${index}`
  const userId = m.userId ?? id
  const joinedAt = m.joinedAt ?? m.joined_at ?? new Date().toISOString()
  return {
    id,
    userId,
    orgId,
    name: m.name ?? 'Unknown',
    email: m.email ?? '',
    avatar: m.avatarUrl ?? undefined,
    role: (m.role as OrgMember['role']) ?? 'developer',
    joinedAt,
  }
}

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function getOrgs(): Promise<Organization[]> {
  const res = await apiClient.get('/api/orgs')
  const data = unwrapBackendResponse<OrgsListPayload>(res.data)

  let list: ApiOrganization[]
  if (Array.isArray(data)) {
    list = data
  } else {
    list = data.organizations ?? data.data ?? data.items ?? []
  }

  return list.map((o) => normalizeOrg(o))
}

export async function getOrgById(id: string): Promise<Organization> {
  const res = await apiClient.get(`/api/orgs/${id}`)
  const data = unwrapBackendResponse<OrgDetailResponse>(res.data)
  return normalizeOrg(data, data.members?.length ?? 0)
}

export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const res = await apiClient.get(`/api/orgs/${orgId}`)
  const data = unwrapBackendResponse<OrgDetailResponse>(res.data)
  return (data.members ?? []).map((m, i) => normalizeMember(orgId, m, i))
}

export async function getOrgProjects(orgId: string): Promise<PaginatedResponse<Project>> {
  return getProjects({ orgId, limit: 100 })
}

export async function createOrg(data: Partial<Organization> & { slug?: string }): Promise<Organization> {
  const name = data.name ?? 'New Organization'
  const slugInput = data.slug?.trim()
  const slug = slugInput ? slugInput : toSlug(name) || `org-${Date.now()}`
  const res = await apiClient.post('/api/orgs', { name, slug })
  const created = unwrapBackendResponse<ApiOrganization>(res.data)
  return normalizeOrg(created, 0)
}

export async function assignOrgAdmin(orgId: string, userId: string): Promise<void> {
  await apiClient.post(`/api/orgs/${orgId}/admin`, { userId })
}

export async function addOrgDeveloper(orgId: string, userId: string): Promise<void> {
  await apiClient.post(`/api/orgs/${orgId}/developers`, { userId })
}

export async function removeOrgMember(orgId: string, userId: string): Promise<void> {
  await apiClient.delete(`/api/orgs/${orgId}/members/${userId}`)
}

export async function deleteOrg(orgId: string): Promise<void> {
  await apiClient.delete(`/api/orgs/${orgId}`)
}
