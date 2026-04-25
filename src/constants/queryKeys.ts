export const KEYS = {
  HEALTH: ['health'] as const,
  AUTH: ['auth'] as const,
  ME: ['me'] as const,
  NOTIFICATIONS: ['notifications'] as const,
  AUDIT_LOGS: ['audit-logs'] as const,

  USERS: ['users'] as const,
  USER: (id: string) => ['users', id] as const,

  ORGS: ['orgs'] as const,
  ORG: (id: string) => ['orgs', id] as const,

  PROJECTS: ['projects'] as const,
  PROJECT: (id: string) => ['projects', id] as const,

  TASKS: ['tasks'] as const,
  TASK: (id: string) => ['tasks', id] as const,
  TASKS_BY_PROJECT: (projectId: string) => ['tasks', 'project', projectId] as const,

  COMMENTS: (taskId: string) => ['comments', taskId] as const,

  ATTACHMENTS: (taskId: string) => ['attachments', taskId] as const,

  UPLOAD_DOWNLOAD_URL: (key: string) => ['uploads', 'download-url', key] as const,
} as const
