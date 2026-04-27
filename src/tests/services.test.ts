import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock the HTTP client ─────────────────────────────────────────────────────

vi.mock('../http/client', () => ({
  get:   vi.fn().mockResolvedValue({}),
  post:  vi.fn().mockResolvedValue({}),
  patch: vi.fn().mockResolvedValue({}),
  del:   vi.fn().mockResolvedValue({}),
}))

import { get } from '../http/client'
import { getTasksApi }    from '../http/services/tasks.service'
import { getProjectsApi } from '../http/services/projects.service'
import { getUsersApi }    from '../http/services/users.service'
import { getOrgsApi }     from '../http/services/orgs.service'

const mockGet = vi.mocked(get)

function capturedPath(): string {
  return mockGet.mock.calls[mockGet.mock.calls.length - 1][0] as string
}

beforeEach(() => mockGet.mockClear())

// ─── Tasks service ────────────────────────────────────────────────────────────

describe('getTasksApi', () => {
  it('calls /api/tasks with no params', async () => {
    await getTasksApi()
    expect(capturedPath()).toBe('/api/tasks')
  })

  it('sends search as ?search=', async () => {
    await getTasksApi({ search: 'login bug' })
    expect(capturedPath()).toContain('search=login+bug')
  })

  it('sends status filter', async () => {
    await getTasksApi({ status: 'in_progress' })
    expect(capturedPath()).toContain('status=in_progress')
  })

  it('sends projectId filter', async () => {
    await getTasksApi({ projectId: 'proj-123' })
    expect(capturedPath()).toContain('projectId=proj-123')
  })

  it('sends assignedUserId — not assigneeId', async () => {
    await getTasksApi({ assignedUserId: 'user-456' })
    const path = capturedPath()
    expect(path).toContain('assignedUserId=user-456')
    expect(path).not.toContain('assigneeId')
  })

  it('sends sortBy and order', async () => {
    await getTasksApi({ sortBy: 'dueDate', sortOrder: 'desc' })
    const path = capturedPath()
    expect(path).toContain('sortBy=dueDate')
    expect(path).toContain('order=desc')
  })

  it('sends page and limit', async () => {
    await getTasksApi({ page: 3, limit: 20 })
    const path = capturedPath()
    expect(path).toContain('page=3')
    expect(path).toContain('limit=20')
  })

  it('does not send undefined params', async () => {
    await getTasksApi({ search: undefined, status: undefined })
    const path = capturedPath()
    expect(path).not.toContain('search=')
    expect(path).not.toContain('status=')
  })
})

// ─── Projects service ─────────────────────────────────────────────────────────

describe('getProjectsApi', () => {
  it('calls /api/projects with no params', async () => {
    await getProjectsApi()
    expect(capturedPath()).toBe('/api/projects')
  })

  it('sends search as ?title= (backend expects title not search)', async () => {
    await getProjectsApi({ search: 'alpha' })
    const path = capturedPath()
    expect(path).toContain('title=alpha')
    expect(path).not.toContain('search=alpha')
  })

  it('sends status filter', async () => {
    await getProjectsApi({ status: 'on_hold' })
    expect(capturedPath()).toContain('status=on_hold')
  })

  it('sends orgId filter', async () => {
    await getProjectsApi({ orgId: 'org-789' })
    expect(capturedPath()).toContain('orgId=org-789')
  })

  it('sends page and limit', async () => {
    await getProjectsApi({ page: 2, limit: 5 })
    const path = capturedPath()
    expect(path).toContain('page=2')
    expect(path).toContain('limit=5')
  })
})

// ─── Users service ────────────────────────────────────────────────────────────

describe('getUsersApi', () => {
  it('calls /api/users with no params', async () => {
    await getUsersApi()
    expect(capturedPath()).toBe('/api/users')
  })

  it('sends search as ?name= (backend expects name not search)', async () => {
    await getUsersApi({ search: 'alice' })
    const path = capturedPath()
    expect(path).toContain('name=alice')
    expect(path).not.toContain('search=alice')
  })

  it('sends status filter', async () => {
    await getUsersApi({ status: 'inactive' })
    expect(capturedPath()).toContain('status=inactive')
  })

  it('sends role filter', async () => {
    await getUsersApi({ role: 'admin' })
    expect(capturedPath()).toContain('role=admin')
  })

  it('sends orgId', async () => {
    await getUsersApi({ orgId: 'org-001' })
    expect(capturedPath()).toContain('orgId=org-001')
  })

  it('sends sortBy and order', async () => {
    await getUsersApi({ sortBy: 'name', sortOrder: 'asc' })
    const path = capturedPath()
    expect(path).toContain('sortBy=name')
    expect(path).toContain('order=asc')
  })

  it('sends unassigned flag', async () => {
    await getUsersApi({ unassigned: true })
    expect(capturedPath()).toContain('unassigned=true')
  })
})

// ─── Orgs service ─────────────────────────────────────────────────────────────

describe('getOrgsApi', () => {
  it('calls /api/orgs with no params', async () => {
    await getOrgsApi()
    expect(capturedPath()).toBe('/api/orgs')
  })

  it('sends search as ?name= (backend expects name not search)', async () => {
    await getOrgsApi({ search: 'orotron' })
    const path = capturedPath()
    expect(path).toContain('name=orotron')
    expect(path).not.toContain('search=orotron')
  })

  it('sends sortBy and order', async () => {
    await getOrgsApi({ sortBy: 'createdAt', order: 'desc' })
    const path = capturedPath()
    expect(path).toContain('sortBy=createdAt')
    expect(path).toContain('order=desc')
  })

  it('sends page and limit', async () => {
    await getOrgsApi({ page: 1, limit: 10 })
    const path = capturedPath()
    expect(path).toContain('page=1')
    expect(path).toContain('limit=10')
  })
})
