import { Link } from '@tanstack/react-router'
import { Eye, Pencil } from 'lucide-react'
import { Avatar } from '../ui/avatar'
import { UserStatusToggle } from './UserStatusToggle'
import { formatDate } from '../../utils/date'
import type { User } from '../../types/user.types'

interface UserTableProps {
  users: User[]
  page?: number
  pageSize?: number
  onEdit?: (user: User) => void
}

export function UserTable({ users, page = 1, pageSize = 20, onEdit }: UserTableProps) {
  return (
    <table className="w-full min-w-max text-sm">
      <thead className="sticky top-0 z-10">
          <tr className="bg-gray-50 border-b border-gray-100">
            {['S.No', 'Name', 'Created On', 'Email', 'Phone Number', 'Status', 'Projects', 'Tasks', 'In Progress', 'Pending', 'Actions'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-4 py-8 text-center text-sm text-gray-400">No users found</td>
            </tr>
          ) : users.map((user, i) => (
            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 text-gray-500 text-xs">{String((page - 1) * pageSize + i + 1).padStart(2, '0')}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={user.name} size="sm" />
                  <span className="font-medium text-gray-800 whitespace-nowrap">{user.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(user.createdAt)}</td>
              <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{user.email}</td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{user.phone || '—'}</td>
              <td className="px-4 py-3"><UserStatusToggle userId={user.id} status={user.status} /></td>
              <td className="px-4 py-3 text-gray-700 text-center font-medium">{user.projects}</td>
              <td className="px-4 py-3 text-gray-700 text-center font-medium">{user.tasks}</td>
              <td className="px-4 py-3 text-gray-700 text-center font-medium">{user.inProgress}</td>
              <td className="px-4 py-3 text-gray-700 text-center font-medium">{user.pending}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/users/$userId"
                    params={{ userId: user.id }}
                    className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition inline-flex"
                    title="View"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(user)}
                      className="p-1.5 rounded-lg text-[#F4622A] hover:bg-orange-50 transition inline-flex"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
    </table>
  )
}
