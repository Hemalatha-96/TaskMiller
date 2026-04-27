import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccessToken } from '../utils/token'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const isAuthenticated = Boolean(getAccessToken())
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard', search: { q: undefined, status: undefined, projectId: undefined, priority: undefined, page: undefined }, replace: true })
    }
    throw redirect({ to: '/login', search: { redirect: undefined }, replace: true })
  },
  component: () => null,
})
