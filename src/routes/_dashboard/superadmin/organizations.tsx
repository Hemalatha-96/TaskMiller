import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { authStore } from '../../../store/auth.store'

export const Route = createFileRoute('/_dashboard/superadmin/organizations')({
  beforeLoad: () => {
    const role = authStore.state.user?.role
    if (role === 'admin')     throw redirect({ to: '/admin/dashboard',  search: {} as any })
    if (role === 'developer') throw redirect({ to: '/dashboard',        search: {} as any })
  },
  component: () => <Outlet />,
})
