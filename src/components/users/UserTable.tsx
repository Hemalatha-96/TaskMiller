import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Eye, MoreVertical, Power } from 'lucide-react'
import Tooltip from '../ui/Tooltip'
import { createColumnHelper, type SortingState, type OnChangeFn } from '@tanstack/react-table'
import DataTable from '../ui/DataTable'
import { useToggleUserStatusMutation } from '../../queries/users.queries'
import { userColor, formatDate , getInitials} from '../../lib/utils'
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

function ActionsCell({
  user,
  isAdmin,
  myId,
  isToggling,
  onToggle,
  onView,
}: {
  user: User
  isAdmin: boolean
  myId: string | undefined
  isToggling: boolean
  onToggle: (id: string, status: UserStatus) => void
  onView: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  return (
    <div className="flex items-center justify-center gap-2">
      <Tooltip label="View profile">
        <button
          onClick={onView}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
        >
          <Eye size={14} />
        </button>
      </Tooltip>

      <div className="relative" ref={menuRef}>
        <Tooltip label="Actions">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isOpen ? 'bg-orange-50 border-orange-200 text-orange-500' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}
          >
            <MoreVertical size={14} />
          </button>
        </Tooltip>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
            {isAdmin && user.id !== myId && (
              <button
                onClick={() => { onToggle(user.id, user.status); setIsOpen(false) }}
                disabled={isToggling}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Power size={13} className={user.status === 'active' ? 'text-red-500' : 'text-green-500'} />
                {user.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            )}
            {!isAdmin && <div className="px-3 py-2 text-xs text-gray-400 italic">No actions</div>}
          </div>
        )}
      </div>
    </div>
  )
}

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

  const handleToggle = useCallback((id: string, current: UserStatus) => {
    toggleStatus({ id, status: current === 'active' ? 'inactive' : 'active' })
  }, [toggleStatus])

  const columns = useMemo(() => [

    columnHelper.display({
      id:     'sno',
      header: 'S.no',
      meta:   { align: 'center', headerClassName: 'w-10' },
      cell:   ({ row }) => (
        <span className="text-gray-400 text-xs">
          {String((activePage - 1) * activeLimit + row.index + 1).padStart(2, '0')}
        </span>
      ),
    }),

    columnHelper.accessor('name', {
      header:        'Name',
      enableSorting: true,
      meta:          { headerClassName: 'min-w-[100px]' },
      cell:          ({ row, getValue }) => (
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full ${userColor(row.original.id)} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
            {row.original.avatarUrl ? (
              <S3Image storageKey={row.original.avatarUrl} fallbackInitials={getInitials(getValue())} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-semibold">{getInitials(getValue())}</span>
            )}
          </div>
          <span className="font-medium text-gray-700 whitespace-nowrap">{getValue()}</span>
        </div>
      ),
    }),

    columnHelper.accessor('email', {
      header:        'Email',
      enableSorting: true,
      meta:          { headerClassName: 'min-w-[120px]' },
      cell:          (info) => (
        <span className="text-gray-500 max-w-[120px] truncate block">{info.getValue()}</span>
      ),
    }),

    columnHelper.accessor('phone', {
      header:        'Phone',
      enableSorting: false,
      meta:          { headerClassName: 'w-24' },
      cell:          (info) => <span className="text-gray-500 max-w-[80px] truncate block">{info.getValue() ?? '—'}</span>,
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
      meta:          { headerClassName: 'w-24' },
      cell:          (info) => (
        <span className="text-gray-500 text-xs whitespace-nowrap">{formatDate(info.getValue())}</span>
      ),
    }),

    columnHelper.accessor('projectCount', {
      header:        'Projects',
      enableSorting: false,
      meta:          { align: 'center', headerClassName: 'w-20' },
      cell:          (info) => (
        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold">
          {info.getValue() ?? 0}
        </span>
      ),
    }),

    columnHelper.accessor('taskCount', {
      header:        'Tasks',
      enableSorting: false,
      meta:          { align: 'center', headerClassName: 'w-20' },
      cell:          (info) => (
        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs font-semibold">
          {info.getValue() ?? 0}
        </span>
      ),
    }),

    columnHelper.accessor('inProgressCount', {
      header:        'In Progress',
      enableSorting: false,
      meta:          { align: 'center', headerClassName: 'w-24' },
      cell:          (info) => (
        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold">
          {info.getValue() ?? 0}
        </span>
      ),
    }),

    columnHelper.accessor('toDoCount', {
      header:        'Pending',
      enableSorting: false,
      meta:          { align: 'center', headerClassName: 'w-20' },
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
      cell:   ({ row }) => (
        <ActionsCell
          user={row.original}
          isAdmin={isAdmin}
          myId={myId}
          isToggling={isToggling}
          onToggle={handleToggle}
          onView={() => navigate({ to: '/users/$userId', params: { userId: row.original.id }, search: {} as any })}
        />
      ),
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
