// constants.ts — app-wide static values that never change at runtime

// ─── User Roles ───────────────────────────────────────────────────────────────

export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN:      'admin',
  DEVELOPER:  'developer',
} as const

// ─── Task Statuses ────────────────────────────────────────────────────────────

export const TASK_STATUS = {
  TO_DO:       'to_do',
  IN_PROGRESS: 'in_progress',
  ON_HOLD:     'on_hold',
  OVERDUE:     'overdue',
  COMPLETED:   'completed',
} as const

export const TASK_STATUS_LABELS: Record<string, string> = {
  to_do:       'To Do',
  in_progress: 'In Progress',
  on_hold:     'On Hold',
  overdue:     'Overdue',
  completed:   'Completed',
}

// ─── Task Priorities ──────────────────────────────────────────────────────────

export const TASK_PRIORITY = {
  LOW:    'low',
  MEDIUM: 'medium',
  HIGH:   'high',
  URGENT: 'urgent',
} as const

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  low:    'Low',
  medium: 'Medium',
  high:   'High',
  urgent: 'Urgent',
}

// ─── Project Statuses ─────────────────────────────────────────────────────────

export const PROJECT_STATUS = {
  ACTIVE:    'active',
  ON_HOLD:   'on_hold',
  COMPLETED: 'completed',
} as const

// ─── Auth Routes ──────────────────────────────────────────────────────────────

export const AUTH_ROUTES = ['/login', '/otp']
