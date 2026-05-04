import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ChevronDown, Pencil, Plus, X, AlignLeft, Search } from 'lucide-react'
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
import { userColor, toAvatarShape, formatDate, getInitials } from '../../../lib/utils'
import type { TaskStatus, Subtask } from '../../../types/task.types'
import type { ApiError } from '../../../types/api.types'

const TABS: Tab[] = ['subtasks', 'assignTo', 'attachments']

type TaskSearch = {
  tab?: Tab
  subtaskSearch?: string
  assigneeSearch?: string
  attachmentSearch?: string
}

export const Route = createFileRoute('/_dashboard/tasks/$taskId')({
  validateSearch: (search: Record<string, unknown>): TaskSearch => ({
    tab: TABS.includes(search.tab as Tab) ? (search.tab as Tab) : undefined,
    subtaskSearch: (search.subtaskSearch as string) || undefined,
    assigneeSearch: (search.assigneeSearch as string) || undefined,
    attachmentSearch: (search.attachmentSearch as string) || undefined,
  }),
  component: TaskViewPage,
})

type Tab = 'subtasks' | 'assignTo' | 'attachments'

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
  const transitions: Record<string, TaskStatus[]> = {
    to_do: ['in_progress'],
    in_progress: ['on_hold', 'completed'],
    on_hold: ['in_progress'],
    completed: [],
    overdue: ['completed'],
  }
  return transitions[current] ?? []
}

function SubtaskCard({
  subtask, parentOnHold, onStatusChange, onEdit,
}: {
  subtask: Subtask
  parentOnHold: boolean
  onStatusChange: (id: string, status: TaskStatus) => void
  onEdit?: () => void
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

      {/* Title + Priority + Edit */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-gray-800 leading-snug">{subtask.title}</p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <PriorityBadge priority={subtask.priority} />
          {onEdit && subtask.status !== 'completed' && (
            <button
              onClick={onEdit}
              className="p-1 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title="Edit subtask"
            >
              <Pencil size={12} />
            </button>
          )}
        </div>
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

      {/* Due Date */}
      <div className="pt-0.5">
        <p className="text-xs text-gray-400">Due Date</p>
        <p className="text-xs font-medium text-gray-700 mt-0.5">
          {subtask.dueDate ? formatDate(subtask.dueDate) : '—'}
        </p>
      </div>

    </div>
  )
}

function TaskViewPage() {
  const { taskId } = Route.useParams()
  const navigate = Route.useNavigate()
  const { isAdmin, isSuperAdmin, isDeveloper, user } = useAuth()

  const { tab, subtaskSearch = '', assigneeSearch = '' } = Route.useSearch()
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  
  const setSubtaskSearch = (val: string) => navigate({ search: (prev) => ({ ...prev, subtaskSearch: val || undefined }), replace: true })
  const setAssigneeSearch = (val: string) => navigate({ search: (prev) => ({ ...prev, assigneeSearch: val || undefined }), replace: true })

  const { data: task, isLoading, isError, error } = useTask(taskId)
  const { data: projectsData } = useProjects({ limit: 100 })
  const { data: attachmentsData } = useAttachments(taskId)
  const { mutate: updateTask } = useUpdateTaskMutation()

  const activeTab: Tab = tab ?? (task?.parentTaskId ? 'assignTo' : 'subtasks')
  const setActiveTab = (t: Tab) => navigate({ to: Route.fullPath, params: { taskId }, search: { tab: t === (task?.parentTaskId ? 'assignTo' : 'subtasks') ? undefined : t }, replace: true })

  const projects = projectsData?.projects ?? []
  const proj = projects.find((p) => p.id === task?.projectId)
  const visibleSubtasks = task
    ? isDeveloper && user
      ? task.subtasks.filter((s) => s.assignees.some((a) => a.id === user.id))
      : task.subtasks
    : []

  const filteredSubtasks = visibleSubtasks.filter(s => s.title.toLowerCase().includes(subtaskSearch.toLowerCase()))
  const filteredAssignees = task ? task.assignees.filter(a => a.name.toLowerCase().includes(assigneeSearch.toLowerCase()) || a.email.toLowerCase().includes(assigneeSearch.toLowerCase())) : []
  const attachmentCount = attachmentsData?.attachments.length ?? 0

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
      <button onClick={() => navigate({ to: '/tasks', search: {} as any })} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 cursor-pointer">
        <ArrowLeft size={15} /> Back to Tasks
      </button>
      <ErrorMessage message={(error as ApiError)?.message ?? 'Task not found'} />
    </div>
  )

  const isSubtask = !!task.parentTaskId
  const handleBack = () => isSubtask
    ? navigate({ to: '/tasks/$taskId', params: { taskId: task.parentTaskId! }, search: { tab: undefined } })
    : navigate({ to: '/tasks', search: {} as any })

  const resolvedTabs: { key: Tab; label: string; count: number }[] = [
    ...(!isSubtask ? [{ key: 'subtasks' as Tab, label: 'Subtasks', count: visibleSubtasks.length }] : []),
    { key: 'assignTo' as Tab, label: 'Assign To', count: task.assignees.length },
    ...(!isSubtask ? [{ key: 'attachments' as Tab, label: 'Attachments', count: attachmentCount }] : []),
  ]

  const hasIncompleteSubtasks = task.subtasks.some(s => s.status !== 'completed')
  const allowed = allowedStatuses(task.status).filter(s =>
    !(s === 'completed' && hasIncompleteSubtasks)
  )

  return (
    <div className="flex flex-col flex-1 gap-4 overflow-hidden pb-4">

      {/* Back */}
      <button
        onClick={handleBack}
        className="flex-shrink-0 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> {isSubtask ? 'Back to Parent Task' : 'Back to Tasks'}
      </button>

      <div className="flex flex-1 gap-5 min-h-0">

        {/* ── Left panel ─────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-white rounded-2xl border border-gray-100">

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
                      className={`flex items-center gap-2 border-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${statusButtonClass[task.status] ?? statusButtonFallback}`}
                    >
                      {statusLabel(task.status)}
                      <ChevronDown size={14} />
                    </button>
                    {statusOpen && (
                      <>
                        <div className="fixed inset-0 z-[9]" onClick={() => setStatusOpen(false)} />
                        <div className="absolute right-0 top-9 z-[10] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[180px]">
                          {allowed.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-amber-600 font-medium">
                              Complete all subtasks first
                            </p>
                          ) : (
                            allowed.map((s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(s)}
                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 cursor-pointer ${s === task.status ? 'text-orange-500 bg-orange-50' : 'text-gray-700'}`}
                              >
                                {statusLabel(s)}
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {isAdmin && task.status !== 'completed' && (
                  <button
                    onClick={() => navigate({ to: '/tasks/$taskId/edit', params: { taskId } })}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
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
                      <S3Image storageKey={task.creator.avatarUrl} fallbackInitials={getInitials(task.creator.name)} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-semibold">{getInitials(task.creator.name)}</span>
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
                    <p className={`text-sm font-semibold px-3 py-1.5 rounded-lg border ${new Date(task.dueDate) < new Date()
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
            {resolvedTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === tab.key ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                  {String(tab.count).padStart(2, '0')}
                </span>
              </button>
            ))}
          </div>

          {/* Tab content wrapper */}
          <div className="flex-1 flex flex-col min-h-0 relative">

            {/* Subtasks tab */}
            {activeTab === 'subtasks' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-shrink-0 sticky top-0 z-20 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 flex-1 max-w-sm">
                    <Search size={14} className="text-gray-400" />
                    <input
                      value={subtaskSearch}
                      onChange={(e) => setSubtaskSearch(e.target.value)}
                      placeholder="Search subtasks..."
                      className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-400 text-xs"
                    />
                  </div>
                  {isAdmin && task.status !== 'completed' && (
                    <button
                      onClick={() => navigate({ to: '/tasks/$taskId/subtask', params: { taskId } })}
                      className="flex items-center gap-1.5 text-xs font-medium text-orange-500 hover:text-orange-600 border border-orange-200 bg-orange-50 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0"
                    >
                      <Plus size={13} /> Add Subtask
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {filteredSubtasks.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">No subtasks found</p>
                  ) : (
                    filteredSubtasks.map((s) => (
                      <SubtaskCard
                        key={s.id}
                        subtask={s}
                        parentOnHold={task.status === 'on_hold'}
                        onStatusChange={handleSubtaskStatusChange}
                        onEdit={isAdmin || isSuperAdmin ? () => navigate({ to: '/tasks/$taskId/edit', params: { taskId: s.id } }) : undefined}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Assign To tab */}
            {activeTab === 'assignTo' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-shrink-0 sticky top-0 z-20 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 flex-1 max-w-sm">
                    <Search size={14} className="text-gray-400" />
                    <input
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      placeholder="Search assignees by name or email..."
                      className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-400 text-xs"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                      <tr className="text-xs text-gray-600 font-semibold">
                        <th className="px-6 py-2.5 text-left bg-[#ccfbf1] w-20">S No</th>
                        <th className="px-6 py-2.5 text-left bg-[#ccfbf1]">Name</th>
                        <th className="px-6 py-2.5 text-left bg-[#ccfbf1]">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredAssignees.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-6 text-center text-sm text-gray-400">No assignees found</td>
                        </tr>
                      ) : (
                        filteredAssignees.map((a, i) => (
                          <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-2.5 text-xs text-gray-400">{String(i + 1).padStart(2, '0')}</td>
                            <td className="px-6 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-full ${userColor(a.id)} flex items-center justify-center relative overflow-hidden`}>
                                  {a.avatarUrl ? (
                                    <S3Image storageKey={a.avatarUrl} fallbackInitials={getInitials(a.name)} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-white text-xs font-semibold">{getInitials(a.name)}</span>
                                  )}
                                </div>
                                <span className="font-medium text-gray-700">{a.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-2.5 text-xs text-gray-400">{a.email}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Attachments tab */}
            {activeTab === 'attachments' && (
              <div className="flex flex-col h-full overflow-hidden">
                <AttachmentsSection taskId={taskId} />
              </div>
            )}

          </div>{/* end tab content wrapper */}

        </div>{/* end left panel */}

        {/* ── Right panel — Comments (main tasks only) ────────────────────── */}
        {!isSubtask && (
          <div className="w-96 flex-shrink-0">
            <CommentsSection
              taskId={taskId}
              userId={user?.id ?? ''}
              userName={user?.name ?? ''}
              avatarUrl={user?.avatarUrl ?? null}
              assignees={task.assignees.map(a => ({ id: a.id, name: a.name, email: a.email, avatarUrl: a.avatarUrl }))}
            />
          </div>
        )}

      </div>
    </div>
  )
}
