import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { LayoutDashboard, CheckSquare, FolderKanban, Users, Building2, HelpCircle, ChevronDown, ChevronRight, ScrollText } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useAuth } from '../../hooks/useAuth'
import { useOrgs } from '../../lib/queries/orgs.queries'
import { useOrgStore } from '../../store/org.store'

export function Sidebar() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const { isAdmin, isSuperAdmin } = useAuth()
  const [orgsOpen, setOrgsOpen] = useState(() => pathname.startsWith('/orgs'))
  const { data: orgs = [] } = useOrgs({ enabled: isSuperAdmin })
  const { activeOrgId, setActiveOrg } = useOrgStore()
  const navigate = useNavigate()

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`)

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-white border-r border-gray-100 flex flex-col z-30 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-[#F4622A] flex items-center justify-center">
          <CheckSquare className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-base tracking-tight">Task Miller</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <Link
          to="/dashboard"
          search={{ q: undefined, status: undefined, projectId: undefined, priority: undefined, page: undefined }}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            isActive('/dashboard')
              ? 'bg-[#F4622A] text-white shadow-sm shadow-orange-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>

        <Link
          to="/tasks"
          search={{ q: undefined, status: undefined, projectId: undefined, priority: undefined, page: undefined }}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            isActive('/tasks')
              ? 'bg-[#F4622A] text-white shadow-sm shadow-orange-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
          )}
        >
          <CheckSquare className="w-5 h-5" />
          Tasks
        </Link>

        <Link
          to="/projects"
          search={{ q: undefined, status: undefined, page: undefined }}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            isActive('/projects')
              ? 'bg-[#F4622A] text-white shadow-sm shadow-orange-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
          )}
        >
          <FolderKanban className="w-5 h-5" />
          Projects
        </Link>

        {isAdmin && (
          <Link
            to="/users"
            search={{ q: undefined, status: undefined, page: undefined }}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              isActive('/users')
                ? 'bg-[#F4622A] text-white shadow-sm shadow-orange-200'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
            )}
          >
            <Users className="w-5 h-5" />
            Users
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/audit-logs"
            search={{ q: undefined, page: undefined }}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              isActive('/audit-logs')
                ? 'bg-[#F4622A] text-white shadow-sm shadow-orange-200'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
            )}
          >
            <ScrollText className="w-5 h-5" />
            Audit Logs
          </Link>
        )}

        {/* Organizations — superadmin only, collapsible */}
        {isSuperAdmin && (
          <div>
            <button
              onClick={() => setOrgsOpen((v) => !v)}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                pathname.startsWith('/orgs')
                  ? 'bg-[#F4622A] text-white shadow-sm shadow-orange-200'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
              )}
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5" />
                Organizations
              </div>
              {orgsOpen ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
            </button>

            {orgsOpen && (
              <div className="mt-1 ml-4 space-y-0.5 border-l border-gray-100 pl-3">
                {orgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => { setActiveOrg(org.id, org.name); navigate({ to: '/orgs/$orgId', params: { orgId: org.id } }) }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium transition-all truncate text-left',
                      activeOrgId === org.id
                        ? 'text-[#F4622A] bg-orange-50'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
                    )}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', activeOrgId === org.id ? 'bg-[#F4622A]' : 'bg-current')} />
                    <span className="truncate">{org.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
          <HelpCircle className="w-5 h-5" />
          Help
        </button>
      </div>
    </aside>
  )
}
