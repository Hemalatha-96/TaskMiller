import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { authStore } from '../store/auth.store'

export const Route = createFileRoute('/_auth')({
  // If already logged in, skip auth pages → go to dashboard (client-only: localStorage is not available on the server)
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const token = authStore.state.accessToken
    if (token) throw redirect({ to: '/dashboard', search: {} as any })
  },
  component: () => <Outlet />,
})
