import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { CheckSquare } from 'lucide-react'
import { getAccessToken } from '../utils/token'

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    // Avoid browser-only state during SSR
    if (typeof window === 'undefined') return

    const token = getAccessToken()
    if (token) throw redirect({ href: '/dashboard' })
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="h-full overflow-y-auto p-4">
        <div className="w-full max-w-md mx-auto min-h-full flex flex-col justify-center py-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-[#F4622A] flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Task Miller</span>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
