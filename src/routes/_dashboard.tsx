import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { authStore } from '../store/auth.store'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import ErrorBoundary from '../components/common/ErrorBoundary'

import { useState } from 'react'

export const Route = createFileRoute('/_dashboard')({
  // Redirect to login if not authenticated (client-only: localStorage is not available on the server)
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const token = authStore.state.accessToken
    if (!token) throw redirect({ to: '/login' })
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-orange-50 overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Topbar onToggleSidebar={() => setIsCollapsed(!isCollapsed)} />
        <main className="flex-1 flex flex-col overflow-y-auto min-h-0 px-6 pt-6 pb-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
