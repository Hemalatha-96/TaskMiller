import React, { useState, useRef, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ChevronDown, Check, Search, CalendarDays, X } from 'lucide-react'
import { useCreateTaskMutation, useUpdateTaskMutation, useTask } from '../../queries/tasks.queries'
import { useProjects, useProject } from '../../queries/projects.queries'
import { useUsers } from '../../queries/users.queries'
import { useAuth } from '../../hooks/useAuth'
import { useOrgContext } from '../../store/orgContext.store'
import { avatarColors , getInitials} from '../../lib/utils'
import type { Task, TaskPriority, CreateTaskBody } from '../../types/task.types'
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
  const [dueDate,         setDueDate]         = useState<Date | null>(task?.dueDate ? new Date(task.dueDate) : null)
  const [selectedProject, setSelectedProject] = useState(task?.projectId ?? preProjectId ?? '')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    task?.assignees.map((a) => a.id) ?? [],
  )
  const [projectOpen,   setProjectOpen]   = useState(false)
  const [memberOpen,    setMemberOpen]    = useState(false)
  const [projectSearch, setProjectSearch] = useState('')
  const [memberSearch,  setMemberSearch]  = useState('')
  const [memberDirection, setMemberDirection] = useState<'down' | 'up'>('down')
  const [projectDirection, setProjectDirection] = useState<'down' | 'up'>('down')

  const projectTriggerRef = useRef<HTMLButtonElement>(null)
  const memberTriggerRef  = useRef<HTMLButtonElement>(null)

  const isEditingSubtask = isEdit && !!task?.parentTaskId
  const projectIdForFilter = isEditingSubtask ? '' : (isEdit ? task?.projectId : selectedProject) ?? ''

  const { data: projectsData }   = useProjects({ limit: 100, orgId })
  const { data: usersData }      = useUsers({ limit: 100, orgId, role: 'developer' })
  const { data: parentTaskData } = useTask(task?.parentTaskId || parentTaskId || '')
  const { data: projectData }    = useProject(projectIdForFilter)

  const { mutate: createTask, isPending: isCreating, error: createError } = useCreateTaskMutation()
  const { mutate: updateTask, isPending: isUpdating, error: updateError } = useUpdateTaskMutation()

  const isPending = isCreating || isUpdating
  const error     = (createError ?? updateError) as ApiError | null

  const errorMessage = error?.message ?? null
  const fieldErrors  = error?.errors?.reduce<Record<string, string>>(
    (acc, e) => ({ ...acc, [e.field]: e.message }),
    {},
  ) ?? {}

  const projects = projectsData?.projects ?? []
  const allUsers = (usersData?.users ?? []).filter((u) => u.role === 'developer')
  const users = (isSubtask || isEditingSubtask) && parentTaskData
    ? allUsers.filter((u) => parentTaskData.assignees.some((a) => a.id === u.id))
    : projectData
    ? allUsers.filter((u) => projectData.members.some((m) => m.id === u.id))
    : allUsers
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

  // Fix 1: re-run whenever the filtered user list changes (projectData / parentTaskData / usersData)
  useEffect(() => {
    if (!usersData) return
    const validIds = new Set(users.map((u) => u.id))
    setSelectedUserIds((prev) => prev.filter((id) => validIds.has(id)))
  }, [usersData, parentTaskData, projectData])

  // Fix 2: clear assignees when project changes in create mode
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (!isEdit) setSelectedUserIds([])
  }, [selectedProject])

  useEffect(() => {
    if (memberOpen && memberTriggerRef.current) {
      const rect = memberTriggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setMemberDirection(spaceBelow < 250 ? 'up' : 'down')
    }
  }, [memberOpen])

  useEffect(() => {
    if (projectOpen && projectTriggerRef.current) {
      const rect = projectTriggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setProjectDirection(spaceBelow < 250 ? 'up' : 'down')
    }
  }, [projectOpen])

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isEdit) {
      updateTask(
        {
          id: task.id,
          body: {
            title,
            description:     description || undefined,
            priority,
            dueDate:         dueDate ? dueDate.toISOString().slice(0, 10) : undefined,
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
        dueDate:         dueDate ? dueDate.toISOString().slice(0, 10) : undefined,
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
            {isEdit ? (isEditingSubtask ? 'Edit Subtask' : 'Edit Task') : isSubtask ? 'Add Subtask' : 'Create Task'}
          </h2>
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Project <span className="text-red-500">*</span></label>
              <div className="relative">
                <button
                  ref={projectTriggerRef}
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
                  <div className={`absolute ${projectDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-[10]`}>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority <span className="text-red-500">*</span></label>
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


          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <div className="relative">
              <DatePicker
                selected={dueDate}
                onChange={(date: Date | null) => setDueDate(date)}
                minDate={new Date()}
                dateFormat="dd MMM yyyy"
                placeholderText="Select a due date"
                isClearable
                clearButtonClassName="dp-clear-btn"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 5))}
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors"
                wrapperClassName="w-full"
                calendarClassName="dp-calendar"
                popperPlacement="bottom-start"
                showPopperArrow={false}
              />
              <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Assignees */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignees
              </label>

              {/* Selected User Chips */}
              {selectedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedUserIds.map((id) => {
                    const u = users.find((user) => user.id === id) || task?.assignees.find(a => a.id === id)
                    if (!u) return null
                    return (
                      <div key={u.id} className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-full text-xs font-medium">
                        {u.name}
                        <button
                          type="button"
                          onClick={() => toggleUser(u.id)}
                          className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                        >
                          <X size={12} className="text-orange-600" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="relative">
                <button
                  ref={memberTriggerRef}
                  type="button"
                  onClick={() => setMemberOpen((v) => !v)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between outline-none focus:border-orange-400 transition-colors"
                >
                  <span className="text-gray-400">
                    {selectedUserIds.length === 0
                      ? 'Select assignees'
                      : 'Add more assignees...'}
                  </span>
                  <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
                </button>

                {memberOpen && (
                  <>
                  <div className="fixed inset-0 z-[9]" onClick={() => { setMemberOpen(false); setMemberSearch('') }} />
                  <div className={`absolute ${memberDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-[10]`}>
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
                      {filteredUsers.filter(u => !selectedUserIds.includes(u.id)).length === 0 ? (
                        <p className="text-sm text-gray-400 px-3 py-3">No more users to assign</p>
                      ) : (
                        filteredUsers.filter(u => !selectedUserIds.includes(u.id)).map((u, i) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => toggleUser(u.id)}
                            className="w-full text-left px-3 py-2.5 hover:bg-orange-50 flex items-center gap-2.5 transition-colors"
                          >
                            <div className={`w-7 h-7 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center flex-shrink-0`}>
                              <span className="text-white text-xs font-semibold">{getInitials(u.name)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">{u.name}</p>
                              <p className="text-xs text-gray-400 truncate">{u.email}</p>
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

          {errorMessage && Object.keys(fieldErrors).length === 0 && (
            <p className="text-xs text-red-500">{errorMessage}</p>
          )}

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
