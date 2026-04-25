import { useState, useRef, useEffect } from 'react'
import { Bell, LogOut, Building2, ChevronDown, Check, CheckSquare, Clock, AlertTriangle, MessageSquare, AtSign, CornerDownRight, UserPlus, UserMinus, FolderKanban, UserCircle } from 'lucide-react'
import { useNavigate, Link } from '@tanstack/react-router'
import { Avatar } from '../ui/avatar'
import { useAuth } from '../../hooks/useAuth'
import { useLogout } from '../../lib/queries/auth.queries'
import { useOrg } from '../../lib/queries/orgs.queries'
import { useOrgStore } from '../../store/org.store'
import { cn } from '../../utils/cn'
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '../../lib/queries/notifications.queries'
import { Spinner } from '../ui/spinner'
import { timeAgo } from '../../utils/date'
import type { Notification } from '../../types/notification.types'

interface TopbarProps {
  title?: string
}

function getNotificationMeta(type: string) {
  const t = String(type ?? '').trim().toLowerCase()
  switch (t) {
    case 'task_assigned':
      return { Icon: CheckSquare, bg: 'bg-blue-50', text: 'text-blue-600' }
    case 'task_due_soon':
      return { Icon: Clock, bg: 'bg-yellow-50', text: 'text-yellow-700' }
    case 'task_overdue':
      return { Icon: AlertTriangle, bg: 'bg-red-50', text: 'text-red-600' }
    case 'task_completed':
      return { Icon: Check, bg: 'bg-green-50', text: 'text-green-600' }
    case 'comment_added':
      return { Icon: MessageSquare, bg: 'bg-purple-50', text: 'text-purple-600' }
    case 'comment_mentioned':
      return { Icon: AtSign, bg: 'bg-orange-50', text: 'text-orange-600' }
    case 'comment_replied':
      return { Icon: CornerDownRight, bg: 'bg-indigo-50', text: 'text-indigo-600' }
    case 'member_added':
      return { Icon: UserPlus, bg: 'bg-green-50', text: 'text-green-600' }
    case 'member_removed':
      return { Icon: UserMinus, bg: 'bg-red-50', text: 'text-red-600' }
    case 'project_assigned':
      return { Icon: FolderKanban, bg: 'bg-blue-50', text: 'text-blue-600' }
    default:
      return { Icon: Bell, bg: 'bg-gray-50', text: 'text-gray-600' }
  }
}

export function Topbar({ title }: TopbarProps) {
  const { user, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const logout = useLogout()
  const { activeOrgId, activeOrgName, setActiveOrg } = useOrgStore()
  // For non-superadmin users: fetch their specific org to get the name
  const { data: userOrgData } = useOrg(!isSuperAdmin && user?.orgId ? user.orgId : '')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const { data: notificationsData, isLoading: notificationsLoading, isError: notificationsIsError, error: notificationsError } = useNotifications()
  const markAllRead = useMarkAllNotificationsRead()
  const markOneRead = useMarkNotificationRead()

  const notifications = notificationsData?.notifications ?? []
  const unreadCount = notifications.reduce((acc, n) => acc + (n.readAt ? 0 : 1), 0)

  // Once the org name is fetched, sync it into the store so all pages display it correctly
  useEffect(() => {
    if (!isSuperAdmin && userOrgData && activeOrgId === userOrgData.id && !activeOrgName) {
      setActiveOrg(userOrgData.id, userOrgData.name)
    }
  }, [userOrgData, isSuperAdmin, activeOrgId, activeOrgName, setActiveOrg])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setDropdownOpen(false)
      if (notificationsRef.current && !notificationsRef.current.contains(target)) setNotificationsOpen(false)
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout.mutateAsync()
    navigate({ href: '/login', replace: true })
  }

  const handleMarkAllRead = async () => {
    if (markAllRead.isPending || unreadCount === 0) return
    try {
      await markAllRead.mutateAsync()
    } catch {
      // Error handled by getApiErrorMessage in mutation
    }
  }

  const openNotificationTarget = async (n: Notification) => {
    setNotificationsOpen(false)

    if (!n.readAt) {
      try {
        await markOneRead.mutateAsync(n.id)
      } catch {
        // non-blocking
      }
    }

    const entityType = String(n.entityType ?? '').trim().toLowerCase()
    const entityId = String(n.entityId ?? '').trim()
    if (!entityType || !entityId) return

    if (entityType === 'task') {
      navigate({ to: '/tasks/$taskId', params: { taskId: entityId } })
      return
    }
    if (entityType === 'project') {
      navigate({ to: '/projects/$projectId', params: { projectId: entityId } })
      return
    }
    if (entityType === 'org' || entityType === 'organization') {
      navigate({ to: '/orgs/$orgId', params: { orgId: entityId } })
      return
    }
    if (entityType === 'user') {
      navigate({ to: '/users/$userId', params: { userId: entityId } })
    }
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-20 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-3">
        {title && <h1 className="text-base font-semibold text-gray-800">{title}</h1>}

        {/* Org indicator — admin / manager / developer: shows their org, clickable to confirm selection */}
        {!isSuperAdmin && user?.orgId && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition bg-white"
            >
              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="max-w-[140px] truncate font-medium">
                {userOrgData?.name ?? activeOrgName ?? 'My Organization'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            </button>

            {dropdownOpen && userOrgData && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-lg border border-gray-200 shadow-lg z-50 overflow-hidden py-1">
                <button
                  onClick={() => { setActiveOrg(userOrgData.id, userOrgData.name); setDropdownOpen(false) }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition',
                    activeOrgId === userOrgData.id ? 'text-[#F4622A] font-semibold' : 'text-gray-700',
                  )}
                >
                  <span className="truncate">{userOrgData.name}</span>
                  {activeOrgId === userOrgData.id && <Check className="w-4 h-4 text-[#F4622A] flex-shrink-0" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen((v) => !v)}
            className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#F4622A] text-white rounded-full text-[10px] leading-[18px] text-center font-semibold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                  {notificationsLoading ? null : unreadCount > 0 ? (
                    <span className="text-xs text-gray-400">({unreadCount} new)</span>
                  ) : (
                    <span className="text-xs text-gray-400">(0 new)</span>
                  )}
                </div>
                <button
                  onClick={handleMarkAllRead}
                  disabled={markAllRead.isPending || unreadCount === 0}
                  className={cn(
                    'text-xs font-medium px-2.5 py-1 rounded-lg border transition',
                    unreadCount === 0 ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-[#F4622A] border-orange-200 hover:bg-orange-50',
                    markAllRead.isPending ? 'opacity-60 pointer-events-none' : '',
                  )}
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {notificationsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                    <Spinner size="sm" />
                    Loading notifications...
                  </div>
                ) : notificationsIsError ? (
                  <div className="px-4 py-8 text-sm text-red-600">
                    {(notificationsError as any)?.message ?? 'Failed to load notifications.'}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-10 text-sm text-gray-500 text-center">No notifications yet.</div>
                ) : (
                  notifications.map((n) => {
                    const { Icon, bg, text } = getNotificationMeta(n.type)
                    const unread = !n.readAt
                    return (
                      <button
                        key={n.id}
                        onClick={() => openNotificationTarget(n)}
                        className={cn(
                          'w-full text-left px-4 py-3 hover:bg-gray-50 transition flex gap-3 border-b border-gray-50 last:border-b-0',
                          unread ? 'bg-orange-50/40' : '',
                        )}
                      >
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', bg)}>
                          <Icon className={cn('w-4 h-4', text)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn('text-sm font-medium truncate', unread ? 'text-gray-900' : 'text-gray-800')}>
                              {n.title}
                            </p>
                            {unread && <span className="w-2 h-2 bg-[#F4622A] rounded-full flex-shrink-0" />}
                          </div>
                          {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                          <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition"
            >
              <Avatar name={user.name} src={user.avatar} size="sm" />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-gray-800 leading-tight">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden py-1">
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <UserCircle className="w-4 h-4 text-gray-400" />
                  My Profile
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { setProfileOpen(false); handleLogout() }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
