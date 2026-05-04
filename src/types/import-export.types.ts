export interface ExportedMember {
  name:     string
  email:    string
  role:     string
  joinedAt: string
}

export interface OrgMembersExport {
  exportedAt:   string
  orgId:        string
  orgName:      string
  totalMembers: number
  members:      ExportedMember[]
}

export interface ImportSubtaskItem {
  title:          string
  description:    string | null
  priority:       string
  dueDate:        string | null
  assigneeEmails: string[]
}

export interface ImportTaskItem extends ImportSubtaskItem {
  subtasks: ImportSubtaskItem[]
}

export interface ImportProjectBody {
  exportedAt: string
  project: {
    title:       string
    description: string | null
  }
  totalTasks: number
  tasks:      ImportTaskItem[]
}

export interface ImportProjectResult {
  projectId:        string
  projectTitle:     string
  tasksImported:    number
  subtasksImported: number
}

export interface ImportTasksBody {
  exportedAt:   string
  projectId:    string
  projectTitle: string
  totalTasks:   number
  tasks:        ImportTaskItem[]
}

export interface ImportTasksResult {
  tasksImported:    number
  subtasksImported: number
}
