import React, { useState } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import { useCreateTaskMutation, useUpdateTaskMutation } from '../../queries/tasks.queries'
import { useProjects } from '../../queries/projects.queries'
import { useUsers } from '../../queries/users.queries'
import { useAuth } from '../../hooks/useAuth'
import { useOrgContext } from '../../store/orgContext.store'
import { avatarColors } from '../../lib/utils'
import type { Task, TaskPriority, TaskStatus, CreateTaskBody } from '../../types/task.types'
import type { ApiError } from '../../types/api.types'

interface TaskFormProps {
  onClose:       () => void
  task?:         Task        // pass to enter edit mode
  parentTaskId?: string      // pass to create a subtask
  projectId?:    string      // pre-select a project (e.g. when creating subtask)
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low',    label: 'Low'    },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High'   },
  { value: 'urgent', label: 'Urgent' },
]

const allStatusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'to_do',       label: 'To Do'       },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold',     label: 'On Hold'     },
  { value: 'completed',   label: 'Completed'   },
]

export default function TaskForm({ onClose, task, parentTaskId, projectId: preProjectId }: TaskFormProps) {
  const isEdit    = !!task
  const isSubtask = !!parentTaskId
  const { isSuperAdmin, orgId: adminOrgId } = useAuth()
  const { selectedOrg } = useOrgContext()

  // For superadmin use the sidebar-selected org; for admin/developer use their own orgId
  const orgId = isSuperAdmin && selectedOrg ? selectedOrg.id : adminOrgId ?? undefined

  const [title,           setTitle]           = useState(task?.title       ?? '')
  const [description,     setDescription]     = useState(task?.description ?? '')
  const [priority,        setPriority]        = useState<TaskPriority>(task?.priority ?? 'medium')
  const [status,          setStatus]          = useState<TaskStatus>(task?.status     ?? 'to_do')
  const [dueDate,         setDueDate]         = useState(task?.dueDate ? task.dueDate.slice(0, 10) : '')
  const [selectedProject, setSelectedProject] = useState(task?.projectId ?? preProjectId ?? '')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    task?.assignees.map((a) => a.id) ?? [],
  )
  const [projectOpen,   setProjectOpen]   = useState(false)
  const [memberOpen,    setMemberOpen]    = useState(false)
  const [projectSearch, setProjectSearch] = useState('')
  const [memberSearch,  setMemberSearch]  = useState('')

  const { data: projectsData } = useProjects({ limit: 100, orgId })
  const { data: usersData }    = useUsers({ limit: 100, orgId, role: 'developer' })

  const { mutate: createTask, isPending: isCreating, error: createError } = useCreateTaskMutation()
  const { mutate: updateTask, isPending: isUpdating, error: updateError } = useUpdateTaskMutation()

  const isPending = isCreating || isUpdating
  const error     = (createError ?? updateError) as ApiError | null

  const errorMessage = error?.message ?? null
  const fieldErrors  = error?.errors?.reduce<Record<string, string>>(
    (acc, e) => ({ ...acc, [e.field]: e.message }),
    {},
  ) ?? {}

  const projects     = projectsData?.projects ?? []
  const users        = (usersData?.users ?? []).filter((u) => u.role === 'developer')
  const selectedProj = projects.find((p) => p.id === selectedProject)

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(projectSearch.toLowerCase()),
  )
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(memberSearch.toLowerCase()),
  )

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isEdit) {
      updateTask(
        {
          id: task.id,
          body: {
            title,
            description:     description || undefined,
            status,
            priority,
            dueDate:         dueDate || undefined,
            assignedUserIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
          },
        },
        { onSuccess: onClose },
      )
    } else {
      const body: CreateTaskBody = {
        title,
        description:     description || undefined,
        priority,
        projectId:       selectedProject,
        dueDate:         dueDate || undefined,
        assignedUserIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      }
      if (parentTaskId) body.parentTaskId = parentTaskId
      createTask(body, { onSuccess: onClose })
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 pb-6">

        <div className="flex items-center pt-6 pb-4 border-b border-gray-100 mb-2">
          <h2 className="text-base font-semibold text-gray-800">
            {isEdit ? 'Edit Task' : isSubtask ? 'Add Subtask' : 'Create Task'}
          </h2>
        </div>

        {errorMessage && Object.keys(fieldErrors).length === 0 && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg mb-4">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build login page"
              required
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors ${fieldErrors.title ? 'border-red-400' : 'border-gray-200'}`}
            />
            {fieldErrors.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description 
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the task"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors resize-none"
            />
          </div>

          {/* Project — create mode only, hidden for subtasks (inherited) */}
          {!isEdit && !isSubtask && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProjectOpen((v) => !v)}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between outline-none focus:border-orange-400 transition-colors ${fieldErrors.projectId ? 'border-red-400' : 'border-gray-200'}`}
                >
                  <span className={selectedProj ? 'text-gray-800' : 'text-gray-400'}>
                    {selectedProj ? selectedProj.title : 'Select a project'}
                  </span>
                  <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
                </button>

                {projectOpen && (
                  <>
                  <div className="fixed inset-0 z-[9]" onClick={() => { setProjectOpen(false); setProjectSearch('') }} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[10]">
                    <div className="p-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5">
                        <Search size={12} className="text-gray-400 flex-shrink-0" />
                        <input
                          autoFocus
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          placeholder="Search projects..."
                          className="bg-transparent outline-none flex-1 text-xs text-gray-700 placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                      {filteredProjects.length === 0 ? (
                        <p className="text-sm text-gray-400 px-3 py-3">No projects found</p>
                      ) : (
                        filteredProjects.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setSelectedProject(p.id); setProjectOpen(false); setProjectSearch('') }}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-orange-50 flex items-center justify-between transition-colors"
                          >
                            <span className="text-gray-700">{p.title}</span>
                            {selectedProject === p.id && <Check size={13} className="text-orange-500" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  </>
                )}
              </div>
              {fieldErrors.projectId && <p className="text-xs text-red-500 mt-1">{fieldErrors.projectId}</p>}
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <div className="flex gap-2">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    priority === opt.value
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status — edit mode only */}
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors cursor-pointer"
                >
                  {allStatusOptions
                    .filter((opt) => {
                      const current = task?.status
                      if (current === 'in_progress' && opt.value === 'to_do') return false
                      if (current === 'on_hold' && opt.value !== 'in_progress' && opt.value !== 'on_hold') return false
                      if (current === 'completed' && opt.value === 'to_do') return false
                      return true
                    })
                    .map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date 
            </label>
            <input
              type="date"
              value={dueDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignees{' '}
              {selectedUserIds.length > 0 && (
                <span className="ml-1.5 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
                  {selectedUserIds.length}
                </span>
              )}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMemberOpen((v) => !v)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between outline-none focus:border-orange-400 transition-colors"
              >
                <span className="text-gray-400">
                  {selectedUserIds.length === 0
                    ? 'Select assignees'
                    : `${selectedUserIds.length} assignee${selectedUserIds.length > 1 ? 's' : ''} selected`}
                </span>
                <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
              </button>

              {memberOpen && (
                <>
                <div className="fixed inset-0 z-[9]" onClick={() => { setMemberOpen(false); setMemberSearch('') }} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[10]">
                  <div className="p-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5">
                      <Search size={12} className="text-gray-400 flex-shrink-0" />
                      <input
                        autoFocus
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="bg-transparent outline-none flex-1 text-xs text-gray-700 placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <p className="text-sm text-gray-400 px-3 py-3">No users found</p>
                    ) : (
                      filteredUsers.map((u, i) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleUser(u.id)}
                          className="w-full text-left px-3 py-2.5 hover:bg-orange-50 flex items-center gap-2.5 transition-colors"
                        >
                          <div className={`w-7 h-7 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-xs font-semibold">{u.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selectedUserIds.includes(u.id) ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                            {selectedUserIds.includes(u.id) && <Check size={10} className="text-white" />}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending
                ? (isEdit ? 'Saving...' : 'Creating...')
                : (isEdit ? 'Save Changes' : isSubtask ? 'Add Subtask' : 'Create Task')}
            </button>
          </div>

        </form>
    </div>
  )
}
