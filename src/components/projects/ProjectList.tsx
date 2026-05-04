import { useNavigate } from '@tanstack/react-router'
import { FolderKanban, ArrowRight } from 'lucide-react'
import ProjectCard from './ProjectCard'
import AvatarStack from '../ui/AvatarStack'
import S3Image from '../ui/S3Image'
import { projectStatusBadge, formatDate, getInitials } from '../../lib/utils'
import type { Project } from '../../types/project.types'

const cardColors = [
  'bg-teal-500',   'bg-gray-800',  'bg-blue-500',
  'bg-violet-500', 'bg-cyan-600',  'bg-indigo-500',
  'bg-pink-500',   'bg-orange-500','bg-green-600',
  'bg-rose-500',   'bg-amber-500', 'bg-sky-500',
]

const statusLabel: Record<string, string> = {
  active:    'Active',
  on_hold:   'On Hold',
  completed: 'Completed',
}

interface ProjectListProps {
  projects: Project[]
  view: 'grid' | 'list'
  startEntry: number
}

export default function ProjectList({ projects, view, startEntry }: ProjectListProps) {
  const navigate = useNavigate()

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
          <FolderKanban size={22} className="text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">No projects found</p>
        <p className="text-xs text-gray-400">Create your first project to get started</p>
      </div>
    )
  }

  if (view === 'list') {
    return (
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-gray-200 text-xs text-gray-600 font-semibold uppercase tracking-wide">
            <th className="px-5 py-3 text-left w-10 bg-[#ccfbf1]">S.no</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Project</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Description</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Members</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Status</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Created</th>
            <th className="px-5 py-3 w-12 bg-[#ccfbf1]" />
          </tr>
        </thead>
        <tbody>
          {projects.map((project, idx) => {
            const color    = cardColors[idx % cardColors.length]
            const initials = getInitials(project.title)
            const avatars  = project.members.map((m, i) => ({
              id:        m.id,
              name:      m.name,
              color:     cardColors[(idx + i + 1) % cardColors.length],
              avatarUrl: m.avatarUrl,
            }))

            return (
              <tr
                key={project.id}
                onClick={() => navigate({ to: '/projects/$projectId', params: { projectId: project.id }, search: { view: 'list' } })}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <td className="px-5 py-3 text-gray-400 text-xs">{startEntry + idx}</td>

                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                      {project.logoUrl ? (
                        <S3Image storageKey={project.logoUrl} fallbackInitials={initials} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-xs">{initials}</span>
                      )}
                    </div>
                    <p className="font-medium text-gray-800">{project.title}</p>
                  </div>
                </td>

                <td className="px-5 py-3 text-xs text-gray-400 max-w-xs truncate">
                  {project.description ?? '—'}
                </td>

                <td className="px-5 py-3">
                  {avatars.length > 0 ? (
                    <AvatarStack avatars={avatars} max={4} size="sm" />
                  ) : (
                    <span className="text-xs text-gray-300">None</span>
                  )}
                </td>

                <td className="px-5 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${projectStatusBadge[project.status] ?? 'bg-gray-50 text-gray-500'}`}>
                    {statusLabel[project.status] ?? project.status}
                  </span>
                </td>

                <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(project.createdAt)}
                </td>

                <td className="px-5 py-3">
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-orange-400 transition-colors ml-auto" />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {projects.map((project, i) => (
        <ProjectCard key={project.id} project={project} index={i} />
      ))}
    </div>
  )
}
