import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { ChevronLeft, Plus, BarChart3, FolderKanban } from 'lucide-react'
import { useProject, useUpdateProject } from '../../../lib/queries/projects.queries'
import { useTasks } from '../../../lib/queries/tasks.queries'
import { ProjectMembersPanel } from '../../../components/projects/ProjectMembersPanel'
import { TaskBoard } from '../../../components/tasks/TaskBoard'
import { getProjectStatusColor } from '../../../utils/status'
import { PROJECT_STATUS_LABELS } from '../../../constants/enums'
import { formatDate } from '../../../utils/date'
import { Avatar } from '../../../components/ui/avatar'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { UploadedImage } from '../../../components/common/UploadedImage'
import { cn } from '../../../utils/cn'

export const Route = createFileRoute('/_dashboard/projects/$projectId')({
  component: ProjectDetailPage,
})

const TABS = ['Members', 'Board'] as const

function ProjectDetailPage() {
  const { projectId } = Route.useParams()
  const { data: project, isLoading, error } = useProject(projectId)
  const { data: tasksData } = useTasks({ projectId, limit: 100 })
  const [activeTab, setActiveTab] = useState<'Members' | 'Board'>('Members')

  const tasks = tasksData?.data ?? []
  const useComputedStats = tasksData != null
  const navigate = useNavigate()
  const updateProject = useUpdateProject()

  const handleRemoveMember = async (userId: string) => {
    if (!project) return
    const newAssignedUserIds = project.members.filter((m) => m.userId !== userId).map((m) => m.userId)
    await updateProject.mutateAsync({
      id: project.id,
      data: {
        assignedUserIds: newAssignedUserIds,
      },
    })
  }

  const handleViewMember = (member: any) => {
    navigate({ to: '/users/$userId', params: { userId: member.userId } })
  }

  const computedStats = useMemo(() => {
    const stats = { total: tasks.length, todo: 0, inProgress: 0, completed: 0, onHold: 0 }
    for (const task of tasks) {
      if (task.status === 'to_do') stats.todo += 1
      if (task.status === 'in_progress') stats.inProgress += 1
      if (task.status === 'completed') stats.completed += 1
      if (task.status === 'on_hold') stats.onHold += 1
    }
    return stats
  }, [tasks])

  // build per-member task count from fetched tasks
  const memberTaskCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const task of tasks) {
      for (const assignee of task.assignees) {
        map[assignee.userId] = (map[assignee.userId] ?? 0) + 1
      }
    }
    return map
  }, [tasks])

  if (isLoading) return <LoadingSpinner />
  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-7xl font-extrabold text-gray-100 mb-4 select-none">404</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Project Not Found</h2>
        <p className="text-sm text-gray-400 mb-6">This project may have been deleted or doesn't exist.</p>
        <Link
          to="/projects"
          search={{ q: undefined, status: undefined, page: undefined }}
          className="inline-flex items-center gap-2 bg-[#F4622A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#E05520] transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Projects
        </Link>
      </div>
    )
  }

  const enrichedMembers = project.members.map((m) => ({
    ...m,
    tasksAssigned: memberTaskCounts[m.userId] ?? m.tasksAssigned,
  }))

  return (
      <div className="space-y-6 h-full overflow-y-auto pr-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/projects" search={{ q: undefined, status: undefined, page: undefined }} className="flex items-center gap-1 hover:text-[#F4622A] transition">
            <ChevronLeft className="w-4 h-4" />
            Projects
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{project.title}</span>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Project Header */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <UploadedImage
                  value={project.logo}
                  alt={`${project.title} logo`}
                  fallback={<FolderKanban className="w-7 h-7 text-[#F4622A]" />}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-base font-bold text-gray-900">{project.title}</h1>
                  <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getProjectStatusColor(project.status))}>
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </div>
                {project.orgName && <p className="text-sm font-medium text-[#F4622A] mb-2">{project.orgName}</p>}
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>Created by: <strong className="text-gray-700">{project.createdByName}</strong></span>
                  <span>Date: <strong className="text-gray-700">{formatDate(project.createdAt)}</strong></span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {TABS.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn('px-6 py-3 text-sm font-medium transition-colors', activeTab === tab ? 'text-[#F4622A] border-b-2 border-[#F4622A]' : 'text-gray-500 hover:text-gray-700')}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="p-4">
              {activeTab === 'Members' && <ProjectMembersPanel members={enrichedMembers} onView={handleViewMember} onRemove={handleRemoveMember} />}
              {activeTab === 'Board' && <TaskBoard tasks={tasks} />}
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#F4622A]" />Statistics
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Tasks', value: useComputedStats ? computedStats.total : project.stats.total, color: 'text-blue-600 bg-blue-50' },
                { label: 'To Do', value: useComputedStats ? computedStats.todo : project.stats.todo, color: 'text-gray-600 bg-gray-50' },
                { label: 'In Progress', value: useComputedStats ? computedStats.inProgress : project.stats.inProgress, color: 'text-purple-600 bg-purple-50' },
                { label: 'Completed', value: useComputedStats ? computedStats.completed : project.stats.completed, color: 'text-green-600 bg-green-50' },
                { label: 'On Hold', value: useComputedStats ? computedStats.onHold : project.stats.onHold, color: 'text-orange-600 bg-orange-50' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{stat.label}</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-lg ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Members preview */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Members</h3>
              <button className="w-6 h-6 rounded-full bg-[#F4622A] text-white flex items-center justify-center hover:bg-[#E05520] transition">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {project.members.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <Avatar name={m.name} size="sm" />
                  <div>
                    <p className="text-xs font-medium text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
