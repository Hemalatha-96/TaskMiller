import { get } from '../client'

export interface ExportTaskItem {
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  assigneeEmails: string[]
  subtasks: ExportTaskItem[]
}

export interface ExportProjectTasksResponse {
  exportedAt: string
  projectId: string
  projectTitle: string
  totalTasks: number
  tasks: ExportTaskItem[]
}

export interface ExportFullProjectResponse {
  exportedAt: string
  project: {
    title: string
    description: string | null
    status: string
  }
  totalTasks: number
  tasks: ExportTaskItem[]
}

export interface ExportOrgMember {
  name: string
  email: string
  role: string
  joinedAt: string
}

export interface ExportOrgMembersResponse {
  exportedAt: string
  orgId: string
  orgName: string
  totalMembers: number
  members: ExportOrgMember[]
}

export const exportProjectTasksApi = (projectId: string) =>
  get<ExportProjectTasksResponse>(`/api/projects/${projectId}/tasks/export`)

export const exportFullProjectApi = (projectId: string) =>
  get<ExportFullProjectResponse>(`/api/projects/${projectId}/export`)

export const exportOrgMembersApi = (orgId: string) =>
  get<ExportOrgMembersResponse>(`/api/orgs/${orgId}/members/export`)
