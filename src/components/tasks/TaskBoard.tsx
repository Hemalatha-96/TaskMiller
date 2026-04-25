import { TaskCard } from './TaskCard'
import { EmptyState } from '../common/EmptyState'
import type { Task, TaskStatus } from '../../types/task.types'

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'to_do', label: 'To Do', color: 'border-gray-300' },
  { key: 'in_progress', label: 'In Progress', color: 'border-blue-400' },
  { key: 'on_hold', label: 'On Hold', color: 'border-orange-400' },
  { key: 'completed', label: 'Completed', color: 'border-green-400' },
]

export function TaskBoard({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key)
        return (
          <div key={col.key} className={`bg-gray-50 rounded-xl border-t-4 ${col.color} p-3`}>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-semibold text-gray-700">{col.label}</span>
              <span className="text-xs font-medium bg-white border border-gray-200 text-gray-500 rounded-full px-2 py-0.5">{colTasks.length}</span>
            </div>
            <div className="space-y-3">
              {colTasks.length === 0 ? (
                <EmptyState title="No tasks" message="Nothing here yet." />
              ) : (
                colTasks.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
