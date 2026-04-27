import { useState, useEffect } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, CheckSquare, FolderKanban, Users, Building2, LogOut, RefreshCw, ScrollText } from 'lucide-react'
import { useQueryClient, useIsFetching } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useLogoutMutation } from '../../queries/auth.queries'
import { useOrgs } from '../../queries/orgs.queries'
import { setSelectedOrg, useOrgContext } from '../../store/orgContext.store'
import type { Organization } from '../../types/org.types'

const navItems = [
  { label: 'Dashboard',     icon: LayoutDashboard, to: '/dashboard',     roles: ['superadmin', 'admin', 'developer'] },
  { label: 'Tasks',         icon: CheckSquare,     to: '/tasks',         roles: ['superadmin', 'admin', 'developer'] },
  { label: 'Projects',      icon: FolderKanban,    to: '/projects',      roles: ['superadmin', 'admin', 'developer'] },
  { label: 'Users',         icon: Users,           to: '/users',         roles: ['superadmin', 'admin'] },
  { label: 'Organizations', icon: Building2,       to: '/organizations', roles: ['superadmin'] },
  { label: 'Audit Logs',    icon: ScrollText,      to: '/audit-logs',    roles: ['superadmin', 'admin'] },
] as const

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (v: boolean) => void
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname          = useRouterState({ select: (s) => s.location.pathname })
  const navigate          = useNavigate()
  const { role, orgName } = useAuth()
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation()
  const { selectedOrg } = useOrgContext()
  const queryClient = useQueryClient()
  const isFetching  = useIsFetching() > 0
  const [orgOpen, setOrgOpen] = useState(false)

  const { data: orgsData } = useOrgs({}, { enabled: role === 'superadmin' })
  const orgs = orgsData?.organizations

  useEffect(() => {
    if (role === 'superadmin' && orgs && orgs.length > 0 && !selectedOrg) {
      const orotron = orgs.find((o) => o.name.toLowerCase() === 'orotron') ?? orgs[0]
      setSelectedOrg(orotron)
    }
  }, [orgs, role, selectedOrg])

  const visibleNav = navItems.filter((item) =>
    role !== null && (item.roles as readonly string[]).includes(role)
  )

  const activeOrgId   = selectedOrg?.id ?? orgs?.[0]?.id
  const activeOrgName = selectedOrg?.name ?? orgs?.[0]?.name ?? orgName ?? ''

  const handleSwitchOrg = (org: Organization) => {
    setSelectedOrg(org)
    setOrgOpen(false)
    queryClient.removeQueries({ queryKey: ['tasks'] })
    queryClient.removeQueries({ queryKey: ['projects'] })
    queryClient.removeQueries({ queryKey: ['users'] })

    const sectionRoots = ['/tasks', '/projects', '/users', '/organizations']
    const match = sectionRoots.find((r) => pathname.startsWith(r + '/'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (match) navigate({ to: match as '/tasks' | '/projects' | '/users' | '/organizations', search: {} as any })
  }

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-[#fffcf5] border-r border-orange-100 flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out z-30`}
    >

      {/* Logo */}
      <div className={`px-4 py-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} border-b border-orange-50`}>
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-200">
          <span className="text-white font-bold text-lg">T</span>
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-gray-800 text-base tracking-tight leading-none">Task Miller</span>
            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-1">Management</span>
          </div>
        )}
      </div>

      {/* Nav items — fills remaining space */}
      <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
        <div className="space-y-1.5">
          {visibleNav.map(({ label, icon: Icon, to }) => {
            const active = pathname === to || pathname.startsWith(to + '/')
            return (
              <Link
                key={to}
                to={to}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                search={{} as any}
                className={`group flex items-center ${
                  isCollapsed ? 'justify-center' : 'gap-3 px-4'
                } py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                    : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'
                }`}
                title={isCollapsed ? label : ''}
              >
                <Icon size={isCollapsed ? 22 : 18} className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-orange-500'} transition-colors`} />
                {!isCollapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Org button + Logout — pinned to bottom */}
      <div className={`border-t border-orange-50 p-4 space-y-3 bg-[#fff9f0]`}>

        {/* Org section */}
        <div className="relative">

          {/* Superadmin: switchable */}
          {role === 'superadmin' && (
            <div className="w-full relative">

              {/* Floating popup above the button */}
              {orgOpen && orgs && orgs.length > 0 && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOrgOpen(false)} />
                  <div className={`absolute bottom-full ${isCollapsed ? 'left-full ml-2' : 'left-0 right-0 mb-2'} bg-white rounded-2xl shadow-2xl border border-orange-100 z-50 overflow-hidden min-w-[200px]`}>
                    <p className="text-xs font-bold text-gray-400 px-4 pt-4 pb-2 uppercase tracking-wider">
                      Organizations
                    </p>
                    <div className="pb-2 max-h-60 overflow-y-auto">
                      {orgs.map((org) => {
                        const isActive = activeOrgId === org.id
                        return (
                          <button
                            key={org.id}
                            onClick={() => handleSwitchOrg(org)}
                            className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors hover:bg-orange-50 ${
                              isActive ? 'text-orange-500 bg-orange-50/50' : 'text-gray-600'
                            }`}
                          >
                            {org.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Trigger button */}
              <button
                onClick={() => !isFetching && setOrgOpen((v) => !v)}
                disabled={isFetching}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} bg-white border border-orange-100 hover:border-orange-200 transition-all rounded-xl p-2 shadow-sm disabled:opacity-60`}
                title={isCollapsed ? activeOrgName : ''}
              >
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Building2 size={16} className="text-orange-600" />
                </div>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left text-xs font-bold text-gray-700 truncate">
                      {activeOrgName}
                    </span>
                    <RefreshCw size={12} className={`flex-shrink-0 ${isFetching ? 'text-orange-400 animate-spin' : 'text-orange-400'}`} />
                  </>
                )}
              </button>

            </div>
          )}

          {/* Admin / Developer: static only */}
          {role !== 'superadmin' && orgName && (
            <div className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} bg-white border border-orange-100 rounded-xl p-2 shadow-sm`}>
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Building2 size={16} className="text-orange-600" />
              </div>
              {!isCollapsed && <span className="flex-1 text-xs font-bold text-gray-700 truncate">{orgName}</span>}
            </div>
          )}

        </div>

        {/* Logout */}
        <button
          onClick={() => logout(undefined, { onSuccess: () => navigate({ to: '/login' }) })}
          disabled={isLoggingOut}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all disabled:opacity-60`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
        </button>

      </div>

    </aside>
  )
}
