import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Eye } from 'lucide-react'
import { createColumnHelper, type SortingState, type OnChangeFn } from '@tanstack/react-table'
import DataTable from '../ui/DataTable'
import UserStatusToggle from './UserStatusToggle'
import { useToggleUserStatusMutation } from '../../queries/users.queries'
import { userColor, formatDate } from '../../lib/utils'
import S3Image from '../ui/S3Image'
import type { User, UserStatus } from '../../types/user.types'

interface UserTableProps {
  users:           User[]
  activePage:      number
  activeLimit:     number
  isAdmin:         boolean
  myId:            string | undefined
  sorting:         SortingState
  onSortingChange: OnChangeFn<SortingState>
}

const columnHelper = createColumnHelper<User>()

export default function UserTable({
  users,
  activePage,
  activeLimit,
  isAdmin,
  myId,
  sorting,
  onSortingChange,
}: UserTableProps) {
  const navigate = useNavigate()
  const { mutate: toggleStatus, isPending: isToggling } = useToggleUserStatusMutation()

  const handleToggle = (id: string, current: UserStatus) => {
    toggleStatus({ id, status: current === 'active' ? 'inactive' : 'active' })
  }

  const columns = useMemo(() => [

    columnHelper.display({
      id:     'sno',
      header: 'S.no',
      meta:   { align: 'center' },
      cell:   ({ row }) => (
        <span className="text-gray-400 text-xs">
          {String((activePage - 1) * activeLimit + row.index + 1).padStart(2, '0')}
        </span>
      ),
    }),

    columnHelper.accessor('name', {
      header:        'Name',
      enableSorting: true,
      cell:          ({ row, getValue }) => (
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full ${userColor(row.original.id)} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
            {row.original.avatarUrl ? (
              <S3Image storageKey={row.original.avatarUrl} fallbackInitials={getValue().charAt(0).toUpperCase()} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-semibold">{getValue().charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="font-medium text-gray-700 whitespace-nowrap">{getValue()}</span>
        </div>
      ),
    }),

    columnHelper.accessor('email', {
      header:        'Email',
      enableSorting: true,
      cell:          (info) => (
        <span className="text-gray-500 max-w-[180px] truncate block">{info.getValue()}</span>
      ),
    }),

    columnHelper.accessor('phone', {
      header:        'Phone',
      enableSorting: false,
      cell:          (info) => <span className="text-gray-500">{info.getValue() ?? '—'}</span>,
    }),

    columnHelper.accessor('status', {
      header:        'Status',
      enableSorting: true,
      meta:          { align: 'center' },
      cell:          (info) => {
        const status = info.getValue()
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
            {status === 'active' ? 'Active' : 'Inactive'}
          </span>
        )
      },
    }),

    columnHelper.accessor('createdAt', {
      header:        'Created On',
      enableSorting: true,
      cell:          (info) => (
        <span className="text-gray-500 text-xs whitespace-nowrap">{formatDate(info.getValue())}</span>
      ),
    }),

    columnHelper.accessor('projectCount', {
      header:        'Projects',
      enableSorting: false,
      meta:          { align: 'center' },
      cell:          (info) => (
        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold">
          {info.getValue() ?? 0}
        </span>
      ),
    }),

    columnHelper.accessor('taskCount', {
      header:        'Tasks',
      enableSorting: false,
      meta:          { align: 'center' },
      cell:          (info) => (
        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs font-semibold">
          {info.getValue() ?? 0}
        </span>
      ),
    }),

    columnHelper.accessor('inProgressCount', {
      header:        'In Progress',
      enableSorting: false,
      meta:          { align: 'center' },
      cell:          (info) => (
        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold">
          {info.getValue() ?? 0}
        </span>
      ),
    }),

    columnHelper.accessor('toDoCount', {
      header:        'Pending',
      enableSorting: false,
      meta:          { align: 'center' },
      cell:          (info) => (
        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
          {info.getValue() ?? 0}
        </span>
      ),
    }),

    columnHelper.display({
      id:     'actions',
      header: 'Actions',
      meta:   { align: 'center' },
      cell:   ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => navigate({ to: '/users/$userId', params: { userId: user.id } })}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors"
              title="View details"
            >
              <Eye size={13} />
            </button>
            {isAdmin && user.id !== myId && (
              <UserStatusToggle
                userId={user.id}
                status={user.status}
                disabled={isToggling}
                onToggle={handleToggle}
              />
            )}
          </div>
        )
      },
    }),

  ], [activePage, activeLimit, isAdmin, myId, isToggling, navigate, handleToggle])

  return (
    <DataTable
      columns={columns}
      data={users}
      sorting={sorting}
      onSortingChange={onSortingChange}
      emptyMessage="No users found."
    />
  )
}
