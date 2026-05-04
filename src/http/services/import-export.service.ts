import { BASE_URL, post } from '../client'
import { authStore } from '../../store/auth.store'
import type {
  OrgMembersExport, ImportProjectBody, ImportProjectResult,
  ImportTasksBody, ImportTasksResult,
} from '../../types/import-export.types'

// Bypasses get() wrapper — handles both { success, data } and direct responses
async function rawExport<T>(path: string): Promise<T> {
  const token = authStore.state.accessToken
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const body = await res.json()
    throw Object.assign(new Error(body.message ?? 'Export failed'), body)
  }
  const body = await res.json()
  return (body.data ?? body) as T
}

export function exportOrgMembersApi(orgId: string): Promise<OrgMembersExport> {
  return rawExport<OrgMembersExport>(`/api/orgs/${orgId}/members/export`)
}

export function exportProjectDetailsApi(projectId: string): Promise<any> {
  return rawExport<any>(`/api/projects/${projectId}/export`)
}

export function importProjectApi(orgId: string, body: ImportProjectBody): Promise<ImportProjectResult> {
  return post<ImportProjectResult>(`/api/orgs/${orgId}/projects/import`, body)
}

export function importTasksApi(projectId: string, body: ImportTasksBody): Promise<ImportTasksResult> {
  return post<ImportTasksResult>(`/api/projects/${projectId}/tasks/import`, body)
}
