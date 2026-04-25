export type UserRole = 'superadmin' | 'admin' | 'manager' | 'developer'
export type UserStatus = 'active' | 'inactive'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: UserRole
  status: UserStatus
  orgId?: string
  createdAt: string
  lastLoginAt?: string
  projects: number
  tasks: number
  inProgress: number
  pending: number
  department?: string
}
