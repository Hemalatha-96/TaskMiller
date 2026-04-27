import { useRouterState, useNavigate, useMatches } from '@tanstack/react-router'
import { ChevronDown, Plus, LogOut, Building2, Mail, ShieldCheck, Phone, Clock, UserCog, Menu } from 'lucide-react'
import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useLogoutMutation } from '../../queries/auth.queries'
import { useMe } from '../../queries/users.queries'
import { useTask } from '../../queries/tasks.queries'
import { useProject } from '../../queries/projects.queries'
import S3Image from '../ui/S3Image'
import { formatDate, roleBadgeClasses, userColor } from '../../lib/utils'
import NotificationPanel from '../notifications/NotificationPanel'

const pageConfig: Record<string, { title: string; action?: string; actionTo?: string }> = {
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
  const { isAdmin, orgName } = useAuth()
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation()
  const { data: profile } = useMe()
  const [menuOpen, setMenuOpen] = useState(false)

  const matches = useMatches()
  const taskId = (matches.find((m) => (m.params as any).taskId)?.params as any)?.taskId
  const projectId = (matches.find((m) => (m.params as any).projectId)?.params as any)?.projectId

  const { data: task } = useTask(taskId || '')
  const { data: project } = useProject(projectId || '')

  const matchedKey = Object.keys(pageConfig)
    .filter((k) => pathname === k || pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0]

  const config     = matchedKey ? pageConfig[matchedKey] : { title: 'Task Miller' }
  const isIndexPage = pathname === matchedKey
  const showAction  = isAdmin && config.action && isIndexPage

  let displayTitle: React.ReactNode = config.title
  if (taskId && task) {
    displayTitle = (
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
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            title="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">{displayTitle}</h1>
        </div>

        <div className="flex items-center gap-3">

          {/* Action button — admin+ only */}
          {showAction && config.actionTo && (
            <button
              onClick={() => navigate({ to: config.actionTo as any })}
              className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
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
              className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
            >
              <div className={`w-8 h-8 ${userColor(profile?.id ?? '')} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                {profile?.avatarUrl ? (
                  <S3Image storageKey={profile.avatarUrl} className="w-full h-full object-cover text-[10px]" />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {displayName.charAt(0).toUpperCase()}
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
              <div className="absolute right-0 top-10 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">

                {/* Profile details */}
                <div className="px-4 py-3 border-b border-gray-100 space-y-2">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">My Profile</p>

                  {profile?.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate">{profile.email}</span>
                    </div>
                  )}

                  {profile?.role && (
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={13} className="text-gray-400 flex-shrink-0" />
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${roleBadgeClasses[profile.role]}`}>
                        {profile.role}
                      </span>
                    </div>
                  )}

                  {profile?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600">{profile.phone}</span>
                    </div>
                  )}

                  {orgName && (
                    <div className="flex items-center gap-2">
                      <Building2 size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate">{orgName}</span>
                    </div>
                  )}

                  {profile?.lastLoginAt && (
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-400">Last login {formatDate(profile.lastLoginAt)}</span>
                    </div>
                  )}
                </div>

                {/* Update profile */}
                <button
                  onClick={() => { setMenuOpen(false); navigate({ to: '/profile' }) }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <UserCog size={14} />
                  My Profile
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  <LogOut size={14} />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>

              </div>
            )}
          </div>

        </div>
      </header>

    </>
  )
}
