import { useMutation, useQueryClient } from '@tanstack/react-query'
import Papa from 'papaparse'
import { exportOrgMembersApi, exportProjectDetailsApi, importProjectApi, importTasksApi } from '../http/services/import-export.service'
import type {
  OrgMembersExport, ImportProjectBody, ImportTaskItem, ImportSubtaskItem,
  ImportTasksBody,
} from '../types/import-export.types'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Org Members Export ────────────────────────────────────────────────────────

function triggerMembersCsvDownload(data: OrgMembersExport) {
  const escape = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`
  const header = 'Name,Email,Role,Joined At'
  const rows   = data.members.map((m) =>
    [escape(m.name), escape(m.email), escape(m.role), escape(m.joinedAt)].join(',')
  )
  const csv = [header, ...rows].join('\n')
  downloadBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    `${data.orgName}-members-${new Date().toISOString().slice(0, 10)}.csv`,
  )
}

export function useExportOrgMembersMutation() {
  return useMutation({
    mutationFn: (orgId: string) => exportOrgMembersApi(orgId),
    onSuccess:  (data) => triggerMembersCsvDownload(data),
  })
}

// ── Project Export ────────────────────────────────────────────────────────────

export function useExportProjectDetailsMutation() {
  return useMutation({
    mutationFn: (projectId: string) => exportProjectDetailsApi(projectId),
    onSuccess: (data: any) => {
      const joinEmails = (emails: any) =>
        Array.isArray(emails) ? emails.join(';') : ''

      const rows: any[][] = [
        ['Title',       data?.project?.title       ?? '', '', '', '', '', ''],
        ['Description', data?.project?.description ?? '', '', '', '', '', ''],
        ['Status',      data?.project?.status      ?? '', '', '', '', '', ''],
        [],
        ['Type', 'Title', 'Description', 'Status', 'Priority', 'Due Date', 'Assignees'],
      ]

      const tasks = Array.isArray(data?.tasks) ? data.tasks : []
      tasks.forEach((task: any) => {
        rows.push([
          'Task',
          task.title       ?? '',
          task.description ?? '',
          task.status      ?? '',
          task.priority    ?? '',
          task.dueDate     ?? '',
          joinEmails(task.assigneeEmails),
        ])
        const subtasks = Array.isArray(task.subtasks) ? task.subtasks : []
        subtasks.forEach((sub: any) => {
          rows.push([
            'Subtask',
            sub.title       ?? '',
            sub.description ?? '',
            sub.status      ?? '',
            sub.priority    ?? '',
            sub.dueDate     ?? '',
            joinEmails(sub.assigneeEmails),
          ])
        })
      })

      const title = (data?.project?.title ?? 'project').replace(/\s+/g, '-')
      downloadBlob(
        new Blob([Papa.unparse(rows)], { type: 'text/csv;charset=utf-8;' }),
        `${title}-export-${new Date().toISOString().slice(0, 10)}.csv`,
      )
    },
  })
}

// ── CSV → JSON parser (common logic) ─────────────────────────────────────────

function parseTasksFromCsvRows(data: string[][], errors: string[]): ImportTaskItem[] {
  const tasks: ImportTaskItem[] = []
  let currentTask: ImportTaskItem | null = null

  for (let i = 5; i < data.length; i++) {
    const row  = data[i]
    const type = row[0]?.trim()
    if (!type) continue

    if (type === 'Task') {
      if (!row[1]?.trim()) errors.push(`Row ${i + 1}: Task title is required`)
      if (!row[4]?.trim()) errors.push(`Row ${i + 1}: Task priority is required`)
      currentTask = {
        title:          row[1]?.trim() ?? '',
        description:    row[2]?.trim() || null,
        priority:       row[4]?.trim() ?? '',
        dueDate:        row[5]?.trim() || null,
        assigneeEmails: row[6]?.trim()
          ? row[6].split(';').map((e) => e.trim()).filter(Boolean)
          : [],
        subtasks: [],
      }
      tasks.push(currentTask)
    } else if (type === 'Subtask') {
      if (!currentTask) {
        errors.push(`Row ${i + 1}: Subtask found without a parent Task`)
        continue
      }
      if (!row[1]?.trim()) errors.push(`Row ${i + 1}: Subtask title is required`)
      if (!row[4]?.trim()) errors.push(`Row ${i + 1}: Subtask priority is required`)
      const sub: ImportSubtaskItem = {
        title:          row[1]?.trim() ?? '',
        description:    row[2]?.trim() || null,
        priority:       row[4]?.trim() ?? '',
        dueDate:        row[5]?.trim() || null,
        assigneeEmails: row[6]?.trim()
          ? row[6].split(';').map((e) => e.trim()).filter(Boolean)
          : [],
      }
      currentTask.subtasks.push(sub)
    }
  }
  return tasks
}

export function parseCsvToImportBody(csvText: string): {
  body:   ImportProjectBody | null
  errors: string[]
} {
  const { data } = Papa.parse<string[]>(csvText, { header: false })
  const errors: string[] = []

  const title       = data[0]?.[1]?.trim() ?? ''
  const description = data[1]?.[1]?.trim() || null

  if (!title) errors.push('Project title is missing in the CSV file')

  const tasks = parseTasksFromCsvRows(data, errors)

  if (errors.length > 0) return { body: null, errors }

  return {
    body: {
      exportedAt: new Date().toISOString(),
      project:    { title, description },
      totalTasks: tasks.length,
      tasks,
    },
    errors: [],
  }
}

export function parseCsvToImportTasksBody(csvText: string, projectId: string, projectTitle: string): {
  body:   ImportTasksBody | null
  errors: string[]
} {
  const { data } = Papa.parse<string[]>(csvText, { header: false })
  const errors: string[] = []

  const tasks = parseTasksFromCsvRows(data, errors)

  if (errors.length > 0) return { body: null, errors }

  return {
    body: {
      exportedAt: new Date().toISOString(),
      projectId,
      projectTitle,
      totalTasks: tasks.length,
      tasks,
    },
    errors: [],
  }
}

// ── Project Import ────────────────────────────────────────────────────────────

export function useImportProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orgId, body }: { orgId: string; body: ImportProjectBody }) =>
      importProjectApi(orgId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// ── Tasks Import into Existing Project ───────────────────────────────────────

export function useImportTasksMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, body }: { projectId: string; body: ImportTasksBody }) =>
      importTasksApi(projectId, body),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
