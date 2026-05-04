import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Bell, CheckCheck, X } from 'lucide-react'
import { useNotifications, useMarkOneReadMutation, useMarkAllReadMutation } from '../../queries/notifications.queries'
import { formatRelativeTime } from '../../lib/utils'
import type { Notification } from '../../types/notification.types'

export default function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const { data: notifications = [] } = useNotifications()
  const { mutate: markOne } = useMarkOneReadMutation()
  const { mutate: markAll, isPending: isMarkingAll } = useMarkAllReadMutation()

  const unreadCount = notifications.filter((n) => !n.readAt).length

  function handleItemClick(n: Notification) {
    if (!n.readAt) markOne(n.id)
    setOpen(false)
    if (n.entityType === 'task') {
      navigate({ to: '/tasks/$taskId', params: { taskId: n.entityId } } as any)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center gap-1 bg-pink-500 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:bg-pink-600 transition-colors cursor-pointer"
      >
        <Bell size={14} />
        {unreadCount > 0 && (
          <span>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 flex flex-col max-h-[480px] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <p className="text-sm font-semibold text-gray-800">Notifications</p>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAll()}
                  disabled={isMarkingAll}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50 cursor-pointer"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start gap-3 last:border-b-0 cursor-pointer ${
                    !n.readAt ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <div className="mt-1.5 flex-shrink-0">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        !n.readAt ? 'bg-indigo-500' : 'bg-transparent'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${
                        !n.readAt
                          ? 'font-semibold text-gray-800'
                          : 'font-medium text-gray-500'
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
