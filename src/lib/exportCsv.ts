import Papa from 'papaparse'
import type { ExportProjectTasksResponse } from '../http/services/export.service'

function buildProjectRows(data: ExportProjectTasksResponse): string[][] {
  const rows: string[][] = [
    ['Title', data.projectTitle, '', '', '', '', ''],
    [],
    ['Type', 'Title', 'Description', 'Status', 'Priority', 'Due Date', 'Assignees'],
  ]

  ;(data.tasks ?? []).forEach((task) => {
    rows.push([
      'Task',
      task.title,
      task.description ?? '',
      task.status,
      task.priority,
      task.dueDate ?? '',
      (task.assigneeEmails ?? []).join(', '),
    ])
    ;(task.subtasks ?? []).forEach((sub) => {
      rows.push([
        'Subtask',
        sub.title,
        sub.description ?? '',
        sub.status,
        sub.priority,
        sub.dueDate ?? '',
        (sub.assigneeEmails ?? []).join(', '),
      ])
    })
  })

  return rows
}

function triggerDownload(csv: string, filename: string) {
  const bom = '﻿'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 500)
}

export function downloadCsv(rows: unknown[][], filename: string) {
  triggerDownload(Papa.unparse(rows as string[][]), filename)
}

export function downloadProjectCsv(data: ExportProjectTasksResponse) {
  const rows = buildProjectRows(data)
  const filename = `tasks-${data.projectTitle.toLowerCase().replace(/\s+/g, '-')}.csv`
  triggerDownload(Papa.unparse(rows), filename)
}
