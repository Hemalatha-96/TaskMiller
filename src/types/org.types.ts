export type OrgMemberRole = 'admin' | 'manager' | 'developer'

export interface Organization {
  id: string
  name: string
  logo?: string
  description?: string
  createdAt: string
  memberCount: number
  projectCount: number
}

export interface OrgMember {
  id: string
  userId: string
  orgId: string
  name: string
  email: string
  avatar?: string
  role: OrgMemberRole
  joinedAt: string
}
