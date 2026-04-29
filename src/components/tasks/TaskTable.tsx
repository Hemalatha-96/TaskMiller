import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { createColumnHelper, type SortingState, type OnChangeFn } from '@tanstack/react-table'
import DataTable from '../ui/DataTable'
import StatusBadge from '../ui/StatusBadge'
import PriorityBadge from '../ui/PriorityBadge'
import AvatarStack from '../ui/AvatarStack'
import { toAvatarShape, formatDate } from '../../lib/utils'
import type { Task } from '../../types/task.types'
import type { Project } from '../../types/project.types'

interface TaskTableProps {
  tasks:            Task[]
  projects:         Project[]
  startEntry:       number
  isAdmin:          boolean
  sorting:          SortingState
  onSortingChange:  OnChangeFn<SortingState>
  onEdit?:          (task: Task) => void
  onDelete?:        (task: Task) => void
}

const columnHelper = createColumnHelper<Task>()

export default function TaskTable({
  tasks,
  projects,
  startEntry,
  isAdmin,
  sorting,
  onSortingChange,
  onEdit,
  onDelete,
}: TaskTableProps) {
  const navigate = useNavigate()

  const columns = useMemo(() => [

    columnHelper.display({
      id:     'sno',
      header: 'S No',
      meta:   { align: 'center' },
      cell:   ({ row }) => (
        <span className="text-gray-500">
          {String(startEntry + row.index).padStart(2, '0')}
        </span>
      ),
    }),

    columnHelper.display({
      id:     'project',
      header: 'Project',
      cell:   ({ row }) => {
        const proj = projects.find((p) => p.id === row.original.projectId)
        return <span className="font-medium text-gray-700">{proj?.title ?? '—'}</span>
      },
    }),

    columnHelper.accessor('title', {
      header:  'Task Name',
      enableSorting: true,
      cell:    (info) => (
        <span className="text-gray-700 max-w-[180px] truncate block">{info.getValue()}</span>
      ),
    }),

    columnHelper.display({
      id:     'assignees',
      header: 'Assigned User',
      cell:   ({ row }) => (
        <AvatarStack avatars={toAvatarShape(row.original.assignees)} max={3} />
      ),
    }),

    columnHelper.accessor('dueDate', {
      header:  'Due Date',
      enableSorting: true,
      cell:    (info) => (
        <span className="text-gray-500 whitespace-nowrap">{formatDate(info.getValue())}</span>
      ),
    }),

    columnHelper.accessor('status', {
      header:  'Status',
      enableSorting: true,
      meta:    { align: 'center' },
      cell:    (info) => <StatusBadge status={info.getValue()} />,
    }),

    columnHelper.accessor('priority', {
      header:  'Priority',
      enableSorting: true,
      meta:    { align: 'center' },
      cell:    (info) => <PriorityBadge priority={info.getValue()} />,
    }),

    columnHelper.display({
      id:     'actions',
      header: 'Actions',
      meta:   { align: 'center' },
      cell:   ({ row }) => {
        const task = row.original
        return (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => navigate({ to: '/tasks/$taskId', params: { taskId: task.id } })}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
              title="View"
            >
              <Eye size={13} />
            </button>
            {isAdmin && onEdit && task.status !== 'completed' && (
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                title="Edit"
              >
                <Pencil size={13} />
              </button>
            )}
            {isAdmin && onDelete && task.status === 'completed' && (
              <button
                onClick={() => onDelete(task)}
                className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )
      },
    }),

  ], [startEntry, projects, isAdmin, onEdit, onDelete, navigate])

  return (
    <DataTable
      columns={columns}
      data={tasks}
      sorting={sorting}
      onSortingChange={onSortingChange}
      emptyMessage="No tasks found."
    />
  )
}
