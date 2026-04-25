import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { getAccessToken } from '../utils/token'

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: ({ location }) => {
    // Check localStorage directly — Zustand persist hydration is async and may
    // not complete before beforeLoad runs on a hard refresh.
    if (typeof window === 'undefined') return
    const token = getAccessToken()
    if (!token) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      const redirectTo = window.location.pathname + window.location.search + window.location.hash
      navigate({ to: '/login', search: { redirect: redirectTo }, replace: true })
    }
  }, [navigate])

  return (
    <div className="h-screen overflow-hidden bg-[#F7F8FC]">
      <Sidebar />
      <div className="ml-[220px] h-screen min-h-0 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 min-h-0 overflow-hidden">
          <div className="p-6 h-full min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
