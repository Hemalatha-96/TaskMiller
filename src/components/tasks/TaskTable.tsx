import { useMemo, useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Eye, Pencil, Trash2, ChevronDown } from 'lucide-react'
import Tooltip from '../ui/Tooltip'
import { createColumnHelper, type SortingState, type OnChangeFn } from '@tanstack/react-table'
import { useUpdateTaskMutation } from '../../queries/tasks.queries'
import DataTable from '../ui/DataTable'
import StatusBadge from '../ui/StatusBadge'
import PriorityBadge from '../ui/PriorityBadge'
import AvatarStack from '../ui/AvatarStack'
import { toAvatarShape, formatDate } from '../../lib/utils'
import type { Task, TaskStatus, TaskPriority } from '../../types/task.types'
import type { Project } from '../../types/project.types'
import type { ApiError } from '../../types/api.types'

const statusTransitions: Record<string, TaskStatus[]> = {
  to_do:       ['in_progress', 'on_hold', 'completed'],
  in_progress: ['on_hold', 'completed'],
  on_hold:     ['in_progress'],
  completed:   ['to_do'],
  overdue:     ['completed'],
}

const statusLabels: Record<string, string> = {
  to_do:       'To Do',
  in_progress: 'In Progress',
  on_hold:     'On Hold',
  overdue:     'Overdue',
  completed:   'Completed',
}

const statusSelectStyle: Record<string, string> = {
  to_do:       'bg-purple-50 text-purple-600 border-purple-200',
  in_progress: 'bg-blue-50   text-blue-600   border-blue-200',
  on_hold:     'bg-amber-50  text-amber-600  border-amber-200',
  overdue:     'bg-red-50    text-red-600    border-red-200',
  completed:   'bg-green-50  text-green-600  border-green-200',
}

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
  const { mutate: updateTask } = useUpdateTaskMutation()
  const [statusError, setStatusError] = useState<{ taskId: string; message: string } | null>(null)

  const handleStatusChange = useCallback((taskId: string, newStatus: TaskStatus) => {
    setStatusError(null)
    updateTask(
      { id: taskId, body: { status: newStatus } },
      {
        onError: (err) => setStatusError({
          taskId,
          message: (err as ApiError).message ?? 'Failed to update status',
        }),
      },
    )
  }, [updateTask])

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
      header:        'Status',
      enableSorting: true,
      meta:          { align: 'center' },
      cell: (info) => {
        const task    = info.row.original
        const allowed = statusTransitions[task.status] ?? []
        const style   = statusSelectStyle[task.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'
        const err     = statusError?.taskId === task.id ? statusError.message : null

        if (allowed.length === 0) return <StatusBadge status={task.status} />

        return (
          <div className="flex flex-col items-center gap-1">
            <div className="relative inline-flex items-center">
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                onClick={(e) => e.stopPropagation()}
                className={`appearance-none pl-2.5 pr-6 py-1 rounded-full text-xs font-medium border cursor-pointer outline-none ${style}`}
              >
                <option value={task.status} disabled>{statusLabels[task.status]}</option>
                {allowed.map((s) => (
                  <option key={s} value={s}>{statusLabels[s]}</option>
                ))}
              </select>
              <ChevronDown size={10} className={`absolute right-1.5 pointer-events-none ${style.split(' ')[1]}`} />
            </div>
            {err && <p className="text-[10px] text-red-500 max-w-[120px] text-center leading-tight">{err}</p>}
          </div>
        )
      },
    }),

    columnHelper.accessor('priority', {
      header:        'Priority',
      enableSorting: true,
      meta:          { align: 'center' },
      cell: (info) => {
        const task = info.row.original
        if (!isAdmin || task.status === 'completed') return <PriorityBadge priority={info.getValue()} />

        const priorityStyle: Record<string, string> = {
          low:    'bg-gray-50   text-gray-500   border-gray-200',
          medium: 'bg-blue-50   text-blue-600   border-blue-200',
          high:   'bg-orange-50 text-orange-600 border-orange-200',
          urgent: 'bg-red-50    text-red-600    border-red-200',
        }
        const style = priorityStyle[task.priority] ?? 'bg-gray-50 text-gray-600 border-gray-200'

        return (
          <div className="relative inline-flex items-center">
            <select
              value={task.priority}
              onChange={(e) => {
                e.stopPropagation()
                updateTask({ id: task.id, body: { priority: e.target.value as TaskPriority } })
              }}
              onClick={(e) => e.stopPropagation()}
              className={`appearance-none pl-2.5 pr-6 py-1 rounded-full text-xs font-medium border cursor-pointer outline-none capitalize ${style}`}
            >
              {['low', 'medium', 'high', 'urgent'].map((p) => (
                <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
            <ChevronDown size={10} className={`absolute right-1.5 pointer-events-none ${style.split(' ')[1]}`} />
          </div>
        )
      },
    }),

    columnHelper.display({
      id:     'actions',
      header: 'Actions',
      meta:   { align: 'center' },
      cell:   ({ row }) => {
        const task = row.original
        return (
          <div className="flex items-center justify-center gap-2">
            <Tooltip label="View task">
              <button
                onClick={() => navigate({ to: '/tasks/$taskId', params: { taskId: task.id }, search: { tab: undefined } })}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
              >
                <Eye size={13} />
              </button>
            </Tooltip>
            {isAdmin && onEdit && task.status !== 'completed' && (
              <Tooltip label="Edit">
                <button
                  onClick={() => onEdit(task)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                >
                  <Pencil size={13} />
                </button>
              </Tooltip>
            )}
            {isAdmin && onDelete && task.status === 'completed' && (
              <Tooltip label="Delete">
                <button
                  onClick={() => onDelete(task)}
                  className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </Tooltip>
            )}
          </div>
        )
      },
    }),

  ], [startEntry, projects, isAdmin, onEdit, onDelete, navigate, handleStatusChange, statusError, updateTask])

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
