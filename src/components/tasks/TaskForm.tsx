import { useState } from 'react'
import { Calendar, X, ChevronDown } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select } from '../ui/select'
import { ErrorMessage } from '../common/ErrorMessage'
import { useCreateTask, useUpdateTask } from '../../lib/queries/tasks.queries'
import { useProjects } from '../../lib/queries/projects.queries'
import { useOrgMembers } from '../../lib/queries/orgs.queries'
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '../../constants/enums'
import type { Task, TaskStatus, TaskPriority } from '../../types/task.types'
import { useAuth } from '../../hooks/useAuth'
import { useOrgStore } from '../../store/org.store'

interface TaskFormProps {
  initial?: Partial<Task>
  onSuccess: () => void
  onCancel: () => void
}

export function TaskForm({ initial, onSuccess, onCancel }: TaskFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [projectId, setProjectId] = useState(initial?.projectId ?? '')
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? 'to_do')
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.slice(0, 10) : '')
  const [tags, setTags] = useState(initial?.tags?.join(', ') ?? '')
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>(
    initial?.assignees?.map((a) => a.userId) ?? []
  )
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [error, setError] = useState('')

  const create = useCreateTask()
  const update = useUpdateTask()
  const { orgId, isSuperAdmin } = useAuth()
  const { activeOrgId } = useOrgStore()
  const effectiveOrgId = activeOrgId ?? (isSuperAdmin ? undefined : orgId ?? undefined)
  const { data: projectsData, isLoading: projectsLoading, error: projectsError } = useProjects({
    limit: 100,
    orgId: effectiveOrgId,
  })
  const { data: orgMembers } = useOrgMembers(effectiveOrgId ?? '')

  const projectOptions = (projectsData?.data ?? []).map((p) => ({ value: p.id, label: p.title }))
  const allUsers = (orgMembers ?? []).map((m) => ({ id: m.userId, name: m.name, email: m.email }))

  const toggleAssignee = (userId: string) => {
    setAssignedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) { setError('Task name is required.'); return }
    if (projectsLoading) { setError('Projects are still loading. Please try again.'); return }
    if (projectsError) { setError('Unable to load projects. Please refresh.'); return }
    if (!projectId) { setError('Please select a project.'); return }

    const selectedProject = projectsData?.data.find((p) => p.id === projectId)
    const payload = {
      name: trimmedName,
      description: description.trim(),
      projectId,
      projectName: selectedProject?.title ?? '',
      status,
      priority,
      dueDate: dueDate ? dueDate.slice(0, 10) : undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      assignedUserIds,
    }

    try {
      if (initial?.id) {
        await update.mutateAsync({ id: initial.id, data: payload })
      } else {
        await create.mutateAsync(payload)
      }
      onSuccess()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save task.')
    }
  }

  const isPending = create.isPending || update.isPending

  const selectedNames = allUsers.filter((u) => assignedUserIds.includes(u.id)).map((u) => u.name)

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <ErrorMessage message={error} />}
      <Input label="Task Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter task name" required />
      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the task..." rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          options={projectOptions}
          placeholder={projectsLoading ? 'Loading projects…' : 'Select project'}
          required
          disabled={projectsLoading}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Due Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pl-10 text-sm text-gray-900 focus:border-[#F4622A] focus:outline-none focus:ring-2 focus:ring-[#F4622A]/20 cursor-pointer"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} options={TASK_STATUS_OPTIONS} />
        <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} options={TASK_PRIORITY_OPTIONS} />
      </div>

      {/* Assignees multi-select */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Assignees</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAssigneeDropdown((v) => !v)}
            className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 transition focus:border-[#F4622A] focus:outline-none focus:ring-2 focus:ring-[#F4622A]/20"
          >
            <span className={selectedNames.length ? 'text-gray-900 truncate' : 'text-gray-400'}>
              {selectedNames.length ? selectedNames.join(', ') : 'Select assignees…'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1" />
          </button>
          {showAssigneeDropdown && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-36 overflow-y-auto">
              {allUsers.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400">No users available</div>
              ) : (
                allUsers.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignedUserIds.includes(user.id)}
                      onChange={() => toggleAssignee(user.id)}
                      className="rounded border-gray-300 text-[#F4622A] focus:ring-[#F4622A] flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{user.name}</div>
                      <div className="text-xs text-gray-400 truncate">{user.email}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          )}
        </div>
        {assignedUserIds.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {allUsers.filter((u) => assignedUserIds.includes(u.id)).map((u) => (
              <span key={u.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
                {u.name}
                <button type="button" onClick={() => toggleAssignee(u.id)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <Input label="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. Backend, API, Urgent" />
      <div className="sticky bottom-0 -mx-5 -mb-4 px-5 pb-4 pt-3 bg-white border-t border-gray-100 flex justify-end gap-3 mt-4 z-10">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isPending}>{initial?.id ? 'Update Task' : 'Create Task'}</Button>
      </div>
    </form>
  )
}
