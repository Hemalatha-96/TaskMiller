import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatRelativeTime,
  userColor,
  avatarColors,
  getInitials,
  truncate,
  toSlug,
  roleBadgeClasses,
  roleAvatarColor,
  projectStatusBadge,
  toAvatarShape,
} from '../lib/utils'

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns — for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('returns — for undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('returns — for empty string', () => {
    expect(formatDate('')).toBe('—')
  })

  it('formats a valid ISO date string', () => {
    const result = formatDate('2026-04-27T00:00:00.000Z')
    expect(result).toMatch(/\d{2} [A-Za-z]+ \d{4}/)
  })

  it('formats a date-only string', () => {
    const result = formatDate('2024-01-15')
    expect(result).toContain('2024')
  })
})

// ─── formatRelativeTime ───────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  it('returns "just now" for dates less than a minute ago', () => {
    const now = new Date().toISOString()
    expect(formatRelativeTime(now)).toBe('just now')
  })

  it('returns minutes ago for recent dates', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago')
  })

  it('returns hours ago for dates within a day', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000).toISOString()
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago')
  })

  it('returns days ago for dates within a week', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString()
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago')
  })

  it('falls back to formatted date for dates older than a week', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60_000).toISOString()
    const result = formatRelativeTime(twoWeeksAgo)
    expect(result).not.toMatch(/ago$/)
    expect(result).toMatch(/\d/)
  })
})

// ─── userColor ────────────────────────────────────────────────────────────────

describe('userColor', () => {
  it('returns one of the defined avatar color classes', () => {
    const color = userColor('abc-123')
    expect(avatarColors).toContain(color)
  })

  it('returns the same color for the same id', () => {
    const id = 'user-consistent-id'
    expect(userColor(id)).toBe(userColor(id))
  })

  it('handles an empty string without throwing', () => {
    expect(() => userColor('')).not.toThrow()
  })
})

// ─── getInitials ──────────────────────────────────────────────────────────────

describe('getInitials', () => {
  it('returns two initials for a full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns single initial for a single-word name', () => {
    expect(getInitials('Alice')).toBe('A')
  })

  it('returns only two chars for longer names', () => {
    expect(getInitials('Alice Bob Charlie')).toBe('AB')
  })

  it('uppercases the result', () => {
    expect(getInitials('john doe')).toBe('JD')
  })
})

// ─── truncate ─────────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('does not truncate strings within the limit', () => {
    expect(truncate('short', 60)).toBe('short')
  })

  it('truncates long strings and appends ellipsis', () => {
    const long = 'a'.repeat(100)
    const result = truncate(long, 60)
    expect(result).toHaveLength(61)
    expect(result.endsWith('…')).toBe(true)
  })

  it('uses 60 as default max', () => {
    const long = 'a'.repeat(80)
    expect(truncate(long)).toHaveLength(61)
  })
})

// ─── toSlug ───────────────────────────────────────────────────────────────────

describe('toSlug', () => {
  it('converts spaces to hyphens', () => {
    expect(toSlug('hello world')).toBe('hello-world')
  })

  it('lowercases the result', () => {
    expect(toSlug('MyOrg')).toBe('myorg')
  })

  it('removes special characters', () => {
    expect(toSlug('hello@world!')).toBe('helloworld')
  })

  it('collapses multiple hyphens', () => {
    expect(toSlug('hello  --  world')).toBe('hello-world')
  })

  it('trims leading and trailing whitespace', () => {
    expect(toSlug('  hello  ')).toBe('hello')
  })
})

// ─── Badge maps ───────────────────────────────────────────────────────────────

describe('roleBadgeClasses', () => {
  it('has entries for all three roles', () => {
    expect(roleBadgeClasses['superadmin']).toBeTruthy()
    expect(roleBadgeClasses['admin']).toBeTruthy()
    expect(roleBadgeClasses['developer']).toBeTruthy()
  })
})

describe('roleAvatarColor', () => {
  it('has a background class for each role', () => {
    for (const role of ['superadmin', 'admin', 'developer']) {
      expect(roleAvatarColor[role]).toMatch(/^bg-/)
    }
  })
})

describe('projectStatusBadge', () => {
  it('has entries for active, on_hold, and completed', () => {
    expect(projectStatusBadge['active']).toBeTruthy()
    expect(projectStatusBadge['on_hold']).toBeTruthy()
    expect(projectStatusBadge['completed']).toBeTruthy()
  })
})

// ─── toAvatarShape ────────────────────────────────────────────────────────────

describe('toAvatarShape', () => {
  it('maps users to avatar shape with a color', () => {
    const users = [{ id: 'u1', name: 'Alice', email: 'a@b.com', avatarUrl: null }]
    const result = toAvatarShape(users)
    expect(result[0].id).toBe('u1')
    expect(result[0].name).toBe('Alice')
    expect(result[0].email).toBe('a@b.com')
    expect(avatarColors).toContain(result[0].color)
    expect(result[0].avatarUrl).toBeNull()
  })

  it('defaults email to empty string when undefined', () => {
    const users = [{ id: 'u2', name: 'Bob' }]
    const result = toAvatarShape(users)
    expect(result[0].email).toBe('')
  })
})
