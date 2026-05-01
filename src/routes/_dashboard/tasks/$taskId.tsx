import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ChevronDown, Pencil, Plus, X, AlignLeft } from 'lucide-react'
import { useTask, useUpdateTaskMutation } from '../../../queries/tasks.queries'
import { useAttachments } from '../../../queries/attachments.queries'
import { useProjects } from '../../../queries/projects.queries'
import { useAuth } from '../../../hooks/useAuth'
import StatusBadge from '../../../components/ui/StatusBadge'
import PriorityBadge from '../../../components/ui/PriorityBadge'
import AvatarStack from '../../../components/ui/AvatarStack'
import S3Image from '../../../components/ui/S3Image'
import CommentsSection from '../../../components/tasks/CommentsSection'
import AttachmentsSection from '../../../components/tasks/AttachmentsSection'
import { TaskDetailSkeleton } from '../../../components/ui/Skeleton'
import ErrorMessage from '../../../components/common/ErrorMessage'
import Pagination from '../../../components/ui/Pagination'
import { userColor, toAvatarShape, formatDate } from '../../../lib/utils'
import type { TaskStatus, Subtask } from '../../../types/task.types'
import type { ApiError } from '../../../types/api.types'

export const Route = createFileRoute('/_dashboard/tasks/$taskId')({
  component: TaskViewPage,
})

type Tab = 'subtasks' | 'assignTo' | 'attachments'

const allStatusOptions: TaskStatus[] = ['to_do', 'in_progress', 'on_hold', 'completed']

function statusLabel(s: TaskStatus) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const statusButtonClass: Record<string, string> = {
  to_do: 'border-purple-300 text-purple-600 bg-white hover:bg-purple-50',
  in_progress: 'border-blue-300   text-blue-600   bg-white hover:bg-blue-50',
  on_hold: 'border-amber-300  text-amber-600  bg-white hover:bg-amber-50',
  overdue: 'border-red-300    text-red-600    bg-white hover:bg-red-50',
  completed: 'border-green-300  text-green-600  bg-white hover:bg-green-50',
}

const statusButtonFallback = 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'

function allowedStatuses(current: string): TaskStatus[] {
  return allStatusOptions.filter((s) => {
    if (s === current) return false
    if (current === 'in_progress' && s === 'to_do') return false
    if (current === 'on_hold' && s !== 'in_progress') return false
    if (current === 'completed' && s === 'to_do') return false
    if (current === 'overdue' && s !== 'completed') return false
    return true
  })
}

function SubtaskCard({
  subtask, parentOnHold, onEdit, onStatusChange, isAdmin,
}: {
  subtask: Subtask
  parentOnHold: boolean
  onEdit: (s: Subtask) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  isAdmin: boolean
}) {
  const statusSelectClass: Record<string, string> = {
    to_do: 'border-purple-300 text-purple-600 bg-purple-50',
    in_progress: 'border-blue-300   text-blue-600   bg-blue-50',
    on_hold: 'border-amber-300  text-amber-600  bg-amber-50',
    overdue: 'border-red-300    text-red-600    bg-red-50',
    completed: 'border-green-300  text-green-600  bg-green-50',
  }

  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">

      {/* Title + Priority */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-gray-800 leading-snug">{subtask.title}</p>
        <PriorityBadge priority={subtask.priority} />
      </div>

      {/* Description */}
      {subtask.description && (
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{subtask.description}</p>
      )}

      {/* Status + Avatars */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {subtask.status === 'completed' ? (
            <StatusBadge status={subtask.status} />
          ) : parentOnHold ? (
            <div title="Task is on hold — subtask status cannot be changed">
              <StatusBadge status={subtask.status} />
            </div>
          ) : (
            <div className="relative">
              <select
                value={subtask.status}
                onChange={(e) => onStatusChange(subtask.id, e.target.value as TaskStatus)}
                className={`appearance-none border rounded-full pl-3 pr-6 py-1 text-xs font-medium outline-none cursor-pointer transition-colors ${statusSelectClass[subtask.status] ?? ''}`}
              >
                <option value={subtask.status} disabled>{statusLabel(subtask.status)}</option>
                {allowedStatuses(subtask.status as TaskStatus).map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-1.5 top-1.5 pointer-events-none opacity-60" />
            </div>
          )}
        </div>
        <AvatarStack avatars={toAvatarShape(subtask.assignees)} max={4} size="sm" />
      </div>

      {/* Due Date + Actions */}
      <div className="flex items-end justify-between pt-0.5">
        <div>
          <p className="text-xs text-gray-400">Due Date</p>
          <p className="text-xs font-medium text-gray-700 mt-0.5">
            {subtask.dueDate ? formatDate(subtask.dueDate) : '—'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {isAdmin && subtask.status !== 'completed' && (
            <button
              onClick={() => onEdit(subtask)}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit subtask"
            >
              <Pencil size={12} />
            </button>
          )}
        </div>
      </div>

    </div>
  )
}

function TaskViewPage() {
  const { taskId } = Route.useParams()
  const navigate = useNavigate()
  const { isAdmin, isDeveloper, user } = useAuth()

  const [activeTab, setActiveTab] = useState<Tab>('subtasks')
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [assigneesPage, setAssigneesPage] = useState(1)
  const [assigneesLimit, setAssigneesLimit] = useState(10)

  const { data: task, isLoading, isError, error } = useTask(taskId)
  const { data: projectsData } = useProjects({ limit: 100 })
  const { data: attachmentsData } = useAttachments(taskId)
  const { mutate: updateTask } = useUpdateTaskMutation()

  const projects = projectsData?.projects ?? []
  const proj = projects.find((p) => p.id === task?.projectId)
  const visibleSubtasks = task
    ? isDeveloper && user
      ? task.subtasks.filter((s) => s.assignees.some((a) => a.id === user.id))
      : task.subtasks
    : []
  const attachmentCount = attachmentsData?.attachments.length ?? 0

  const tabs: { key: Tab; label: string; count: number }[] = task
    ? [
      { key: 'subtasks', label: 'Subtasks', count: visibleSubtasks.length },
      { key: 'assignTo', label: 'Assign To', count: task.assignees.length },
      { key: 'attachments', label: 'Attachments', count: attachmentCount },
    ]
    : []

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatusError(null)
    setStatusOpen(false)
    updateTask(
      { id: taskId, body: { status: newStatus } },
      { onError: (err) => setStatusError((err as ApiError).message ?? 'Failed to update status') },
    )
  }

  const handleSubtaskStatusChange = (subtaskId: string, newStatus: TaskStatus) => {
    updateTask({ id: subtaskId, body: { status: newStatus } })
  }

  if (isLoading) return <TaskDetailSkeleton />

  if (isError || !task) return (
    <div className="py-8">
      <button onClick={() => navigate({ to: '/tasks', search: {} as any })} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={15} /> Back to Tasks
      </button>
      <ErrorMessage message={(error as ApiError)?.message ?? 'Task not found'} />
    </div>
  )

  const allowed = allowedStatuses(task.status)

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 overflow-y-auto pb-6">

      {/* Back */}
      <button
        onClick={() => navigate({ to: '/tasks', search: {} as any })}
        className="flex-shrink-0 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Tasks
      </button>

      <div className="flex flex-col lg:flex-row flex-1 gap-5 items-start">

        {/* ── Left panel ─────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-white rounded-2xl border border-gray-100 w-full">

          {/* Fixed top section */}
          <div className="flex-shrink-0 p-6 space-y-5">

            {/* Title row */}
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-800 leading-snug">{task.title}</h2>
              <div className="flex items-center gap-2 flex-shrink-0">
                {task.status === 'completed' ? (
                  <StatusBadge status={task.status} />
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setStatusOpen(!statusOpen)}
                      className={`flex items-center gap-2 border-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${statusButtonClass[task.status] ?? statusButtonFallback}`}
                    >
                      {statusLabel(task.status)}
                      <ChevronDown size={14} />
                    </button>
                    {statusOpen && (
                      <>
                        <div className="fixed inset-0 z-[9]" onClick={() => setStatusOpen(false)} />
                        <div className="absolute right-0 top-9 z-[10] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
                          {allowed.map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(s)}
                              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${s === task.status ? 'text-orange-500 bg-orange-50' : 'text-gray-700'}`}
                            >
                              {statusLabel(s)}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {isAdmin && task.status !== 'completed' && (
                  <button
                    onClick={() => navigate({ to: '/tasks/$taskId/edit', params: { taskId } })}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit task"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Status error */}
            {statusError && (
              <div className="flex items-center justify-between gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
                <span>{statusError}</span>
                <button onClick={() => setStatusError(null)} className="text-red-400 hover:text-red-600 transition-colors">
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Project */}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Project</p>
              <p className="text-sm font-bold text-gray-800">{proj?.title ?? '—'}</p>
            </div>

            <hr className="border-gray-300" />

            {/* Description + Created By + Due Date */}
            <div className="flex gap-6 items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <AlignLeft size={15} className="text-gray-400" />
                  <p className="text-sm font-semibold text-gray-700">Description</p>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {task.description ?? <span className="italic text-gray-300">No description provided</span>}
                </p>
              </div>
              <div className="flex-shrink-0 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden ${userColor(task.creator.id)}`}>
                    {task.creator.avatarUrl ? (
                      <S3Image storageKey={task.creator.avatarUrl} fallbackInitials={task.creator.name.charAt(0).toUpperCase()} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-semibold">{task.creator.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Created By</p>
                    <p className="text-sm font-bold text-gray-800">{task.creator.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(task.createdAt).toLocaleString('en-GB', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Due Date</p>
                  {task.dueDate ? (
                    <p className={`text-sm font-semibold px-3 py-1.5 rounded-lg border ${
                      new Date(task.dueDate) < new Date()
                        ? 'text-red-500 bg-red-50 border-red-100'
                        : 'text-gray-700 bg-gray-50 border-gray-200'
                    }`}>
                      {formatDate(task.dueDate)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">—</p>
                  )}
                </div>
              </div>
            </div>

          </div>{/* end fixed top */}

          {/* Sticky tabs nav */}
          <div className="flex-shrink-0 flex gap-0 border-b border-gray-100 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.key ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {String(tab.count).padStart(2, '0')}
                </span>
              </button>
            ))}
          </div>

          {/* Scrollable tab content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 pt-4">

            {/* Subtasks tab */}
            {activeTab === 'subtasks' && (
              <div className="space-y-3">
                {isAdmin && task.status !== 'completed' && (
                  <button
                    onClick={() => navigate({ to: '/tasks/$taskId/subtask', params: { taskId } })}
                    className="flex items-center gap-1.5 text-xs font-medium text-orange-500 hover:text-orange-600 border border-orange-200 bg-orange-50 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <Plus size={13} /> Add Subtask
                  </button>
                )}
                {visibleSubtasks.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No subtasks yet</p>
                ) : (
                  visibleSubtasks.map((s) => (
                    <SubtaskCard
                      key={s.id}
                      subtask={s}
                      parentOnHold={task.status === 'on_hold'}
                      onEdit={(sub) => navigate({ to: '/tasks/$taskId/edit', params: { taskId: sub.id } })}
                      onStatusChange={handleSubtaskStatusChange}
                      isAdmin={isAdmin}
                    />
                  ))
                )}
              </div>
            )}

            {/* Assign To tab */}
            {activeTab === 'assignTo' && (
              <div className="flex flex-col h-full overflow-hidden -mx-6 px-6">
                <div className="flex-1 overflow-auto min-h-0">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-20">
                      <tr className="text-xs text-gray-600 font-semibold">
                        <th className="px-4 py-2.5 text-left bg-[#ccfbf1]">S No</th>
                        <th className="px-4 py-2.5 text-left bg-[#ccfbf1]">Name</th>
                        <th className="px-4 py-2.5 text-left bg-[#ccfbf1]">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {task.assignees.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">No assignees</td>
                        </tr>
                      ) : (
                        (() => {
                          const start = (assigneesPage - 1) * assigneesLimit
                          const paged = task.assignees.slice(start, start + assigneesLimit)
                          return paged.map((a, i) => (
                            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-2.5 text-xs text-gray-400">{String(start + i + 1).padStart(2, '0')}</td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-7 h-7 rounded-full ${userColor(a.id)} flex items-center justify-center relative overflow-hidden`}>
                                    {a.avatarUrl ? (
                                      <S3Image storageKey={a.avatarUrl} fallbackInitials={a.name.charAt(0).toUpperCase()} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-white text-xs font-semibold">{a.name.charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <span className="font-medium text-gray-700">{a.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-400">{a.email}</td>
                            </tr>
                          ))
                        })()
                      )}
                    </tbody>
                  </table>
                </div>

                {task.assignees.length > 0 && (
                  <Pagination
                    page={assigneesPage}
                    totalPages={Math.ceil(task.assignees.length / assigneesLimit)}
                    totalRecords={task.assignees.length}
                    startEntry={(assigneesPage - 1) * assigneesLimit + 1}
                    endEntry={Math.min(assigneesPage * assigneesLimit, task.assignees.length)}
                    limit={assigneesLimit}
                    hasPrevPage={assigneesPage > 1}
                    hasNextPage={assigneesPage < Math.ceil(task.assignees.length / assigneesLimit)}
                    onPageChange={setAssigneesPage}
                    onLimitChange={(l) => { setAssigneesLimit(l); setAssigneesPage(1) }}
                    className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white border-t border-gray-100"
                  />
                )}
              </div>
            )}

            {/* Attachments tab */}
            {activeTab === 'attachments' && (
              <AttachmentsSection taskId={taskId} />
            )}

          </div>{/* end scrollable content */}

        </div>{/* end left panel */}

        {/* ── Right panel — Comments ──────────────────────────────────────── */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <CommentsSection
            taskId={taskId}
            userId={user?.id ?? ''}
            userName={user?.name ?? ''}
            avatarUrl={user?.avatarUrl ?? null}
            assignees={task.assignees.map(a => ({ id: a.id, name: a.name, email: a.email, avatarUrl: a.avatarUrl }))}
          />
        </div>

      </div>
    </div>
  )
}
