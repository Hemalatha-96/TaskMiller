import { useRouterState, useNavigate, useMatches } from '@tanstack/react-router'
import { ChevronDown, Plus, LogOut, UserCog, Menu, LayoutDashboard, Search } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useLogoutMutation } from '../../queries/auth.queries'
import { useMe } from '../../queries/users.queries'
import { useTask } from '../../queries/tasks.queries'
import { useProject } from '../../queries/projects.queries'
import S3Image from '../ui/S3Image'
import { Kbd } from '../ui/Kbd'
import { roleBadgeClasses, userColor, getInitials } from '../../lib/utils'
import NotificationPanel from '../notifications/NotificationPanel'

const pageConfig: Record<string, { title: string; action?: string; actionTo?: string }> = {
  '/superadmin':   { title: 'Dashboard'                                                            },
  '/admin':        { title: 'Dashboard',     action: 'Add Task',    actionTo: '/tasks/new'         },
  '/dashboard':    { title: 'Dashboard',     action: 'Add Task',    actionTo: '/tasks/new'         },
  '/tasks':        { title: 'Tasks',         action: 'Add Task',    actionTo: '/tasks/new'         },
  '/projects':     { title: 'Projects',      action: 'Add Project', actionTo: '/projects/new'      },
  '/users':        { title: 'Users',         action: 'Add User',    actionTo: '/users/new'         },
  '/organizations':{ title: 'Organizations'                                                        },
  '/audit-logs':   { title: 'Audit Logs'                                                           },
  '/profile':      { title: 'My Profile'                                                           },
}


export default function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const { isAdmin, isSuperAdmin } = useAuth()
  const locationHref = useRouterState({ select: (s) => s.location.href })
  const isAdminView  = !pathname.startsWith('/superadmin') && !locationHref.includes('from=superadmin')
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation()
  const { data: profile } = useMe()
  const [menuOpen, setMenuOpen] = useState(false)
  const searchRef       = useRef<HTMLInputElement>(null)
  const showTaskSearch  = pathname === '/tasks' || pathname === '/admin/dashboard' || pathname === '/dashboard'
  const taskSearchValue = useRouterState({ select: (s) => (s.location.search as any)?.search as string ?? '' })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && showTaskSearch) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showTaskSearch])

  const matches = useMatches()
  const taskId = (matches.find((m) => (m.params as any).taskId)?.params as any)?.taskId
  const projectId = (matches.find((m) => (m.params as any).projectId)?.params as any)?.projectId

  const { data: task }       = useTask(taskId || '')
  const { data: parentTask } = useTask(task?.parentTaskId ?? '')
  const { data: project }    = useProject(projectId || '')

  const matchedKey = Object.keys(pageConfig)
    .filter((k) => pathname === k || pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0]

  const config     = matchedKey ? pageConfig[matchedKey] : { title: 'Task Miller' }
  const isIndexPage = pathname === matchedKey
  const showAction  = isAdmin && config.action && isIndexPage

  let displayTitle: React.ReactNode = config.title
  if (taskId && task) {
    displayTitle = task.parentTaskId && parentTask ? (
      <div className="flex items-center gap-2">
        <span className="text-gray-400 font-medium">{config.title}</span>
        <span className="text-gray-300 text-sm font-light">/</span>
        <span className="text-gray-400 truncate max-w-[180px]">{parentTask.title}</span>
        <span className="text-gray-300 text-sm font-light">/</span>
        <span className="truncate max-w-[180px]">{task.title}</span>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <span className="text-gray-400 font-medium">{config.title}</span>
        <span className="text-gray-300 text-sm font-light">/</span>
        <span className="truncate max-w-[300px]">{task.title}</span>
      </div>
    )
  } else if (projectId && project) {
    displayTitle = (
      <div className="flex items-center gap-2">
        <span className="text-gray-400 font-medium">{config.title}</span>
        <span className="text-gray-300 text-sm font-light">/</span>
        <span className="truncate max-w-[300px]">{project.title}</span>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
  }

  const displayName = profile?.name  ?? '...'
  const displayRole = profile?.role  ?? null

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between flex-shrink-0">

        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">{displayTitle}</h1>
        </div>

        <div className="flex items-center gap-3">

        {/* // Task search — visible on /tasks index only */}
          {showTaskSearch && (
            <div className="relative flex items-center border border-gray-200 rounded-lg bg-gray-50 focus-within:border-orange-400 focus-within:bg-white transition-colors">
              <Search size={13} className="absolute left-3 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                value={taskSearchValue}
                onChange={(e) => (navigate as any)({ to: pathname, search: (prev: any) => ({ ...prev, search: e.target.value || undefined, page: undefined }) })}
                placeholder="Search tasks..."
                className="bg-transparent outline-none text-xs text-gray-700 placeholder-gray-400 pl-8 pr-16 py-1.5 w-44"
              />
              {!taskSearchValue && (
                <div className="absolute right-2.5 flex items-center gap-0.5 pointer-events-none">
                  <Kbd>Ctrl</Kbd>
                  <Kbd>K</Kbd>
                </div>
              )}
            </div>
          )} 

          {/* Action button — admin+ only */}
          {showAction && config.actionTo && (
            <button
              onClick={() => navigate({ to: config.actionTo as any })}
              className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <Plus size={15} />
              {config.action}
            </button>
          )}

          {/* Notifications */}
          <NotificationPanel />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <div className={`w-8 h-8 ${userColor(profile?.id ?? '')} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                {profile?.avatarUrl ? (
                  <S3Image storageKey={profile.avatarUrl} className="w-full h-full object-cover text-[10px]" />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {getInitials(displayName)}
                  </span>
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700 leading-none">{displayName}</p>
                {displayRole && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleBadgeClasses[displayRole]}`}>
                    {displayRole}
                  </span>
                )}
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">

                  <button
                    onClick={() => { setMenuOpen(false); navigate({ to: '/profile' }) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer"
                  >
                    <UserCog size={14} />
                    My Profile
                  </button>

                  {isSuperAdmin && (
                    <>
                      <button
                        onClick={() => { setMenuOpen(false); navigate({ to: '/superadmin/dashboard', search: {} as any }) }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors border-b border-gray-100 cursor-pointer ${
                          !isAdminView ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <LayoutDashboard size={14} />
                        SuperAdmin View
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); navigate({ to: '/admin/dashboard', search: {} as any }) }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors border-b border-gray-100 cursor-pointer ${
                          isAdminView ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <LayoutDashboard size={14} />
                        Admin View
                      </button>
                    </>
                  )}

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <LogOut size={14} />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </button>

                </div>
              </>
            )}
          </div>

        </div>
      </header>

    </>
  )
}
