export interface OrgsParams {
  search?:  string
  sortBy?:  'name' | 'createdAt'
  order?:   'asc' | 'desc'
  page?:    number
  limit?:   number
}

export interface OrgsPagination {
  currentPage:  number
  limit:        number
  totalRecords: number
  totalPages:   number
  hasNextPage:  boolean
  hasPrevPage:  boolean
}

export interface OrgsResponse {
  organizations: Organization[]
  pagination:    OrgsPagination
}

export interface Organization {
  id: string
  name: string
  slug: string
  ownerId: string | null
  createdAt: string
}

export interface OrgMember {
  memberId: string
  role: 'admin' | 'developer'
  joinedAt: string
  userId: string
  name: string
  email: string
  avatarUrl: string | null
  status: string
}

export interface OrganizationDetail extends Organization {
  description: string | null
  updatedAt: string
  deletedAt: string | null
  deletedBy: string | null
  members: OrgMember[]
}

// ─── Mutation response types ──────────────────────────────────────────────────

export interface AssignAdminResponse {
  org: OrganizationDetail
  member: {
    id:       string
    orgId:    string
    userId:   string
    role:     'admin'
    joinedAt: string
  }
}

export interface AddDeveloperResponse {
  id:       string
  orgId:    string
  userId:   string
  role:     'developer'
  joinedAt: string
  user: {
    id:        string
    name:      string
    email:     string
    phone:     string | null
    avatarUrl: string | null
    status:    string
  }
}

export interface RemoveMemberResponse {
  message: string
}

export interface DeleteOrgResponse {
  message: string
  org: { id: string; name: string }
}
