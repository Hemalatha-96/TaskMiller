import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { authStore } from '../store/auth.store'
import { dashboardByRole } from '../lib/utils'

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const token = authStore.state.accessToken
    if (token) throw redirect({ to: dashboardByRole(authStore.state.user?.role) as any, search: {} as any })
  },
  component: () => <Outlet />,
})
