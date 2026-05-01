import { FolderKanban, Eye, Download } from 'lucide-react'
import S3Image from '../ui/S3Image'
import AvatarStack from '../ui/AvatarStack'
import { projectStatusBadge } from '../../lib/utils'
import type { Project } from '../../types/project.types'

interface ProjectListProps {
  projects:    Project[]
  onView:      (id: string) => void
  onExport?:   (id: string) => void
  exportingId?: string | null
}

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

export default function ProjectList({ projects, onView, onExport, exportingId }: ProjectListProps) {

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

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-gray-200 text-xs text-gray-600 font-semibold uppercase tracking-wide">
          <th className="px-5 py-3 text-left w-12 bg-[#ccfbf1]">S.No</th>
          <th className="px-5 py-3 text-left bg-[#ccfbf1]">Project</th>
          <th className="px-5 py-3 text-left bg-[#ccfbf1]">Description</th>
          <th className="px-5 py-3 text-left bg-[#ccfbf1]">Status</th>
          <th className="px-5 py-3 text-left bg-[#ccfbf1]">Members</th>
          <th className="px-5 py-3 text-left bg-[#ccfbf1]">Created By</th>
          {onExport && <th className="px-5 py-3 w-16 bg-[#ccfbf1]" />}
          <th className="px-5 py-3 w-16 bg-[#ccfbf1]" />
        </tr>
      </thead>
      <tbody>
        {projects.map((project, idx) => {
          const color    = cardColors[idx % cardColors.length]
          const initials = project.title.slice(0, 2).toUpperCase()
          const avatars  = project.members.map((m, i) => ({
            id:        m.id,
            name:      m.name,
            color:     cardColors[(idx + i + 1) % cardColors.length],
            avatarUrl: m.avatarUrl,
          }))

          return (
            <tr
              key={project.id}
              className="border-b border-gray-50 hover:bg-gray-50 transition-colors align-middle"
            >
              {/* S.No */}
              <td className="px-5 py-3 text-xs text-gray-400">{idx + 1}</td>

              {/* Project */}
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                    {project.logoUrl ? (
                      <S3Image storageKey={project.logoUrl} fallbackInitials={initials} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xs">{initials}</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-800 line-clamp-1">{project.title}</span>
                </div>
              </td>

              {/* Description */}
              <td className="px-5 py-3 max-w-[260px]">
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {project.description ?? '—'}
                </p>
              </td>

              {/* Status */}
              <td className="px-5 py-3 whitespace-nowrap">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${projectStatusBadge[project.status] ?? 'bg-gray-50 text-gray-500'}`}>
                  {statusLabel[project.status] ?? project.status}
                </span>
              </td>

              {/* Members */}
              <td className="px-5 py-3">
                {avatars.length > 0 ? (
                  <AvatarStack avatars={avatars} max={4} size="sm" />
                ) : (
                  <span className="text-xs text-gray-300">No members</span>
                )}
              </td>

              {/* Created By */}
              <td className="px-5 py-3 whitespace-nowrap">
                <p className="text-xs font-medium text-gray-700">{project.creator.name}</p>
                <p className="text-xs text-gray-400">{project.creator.email}</p>
              </td>

              {/* Export */}
              {onExport && (
                <td className="px-5 py-3 text-center">
                  <button
                    onClick={() => onExport(project.id)}
                    disabled={exportingId === project.id}
                    className="text-gray-400 hover:text-green-500 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Export project as CSV"
                  >
                    <Download size={15} />
                  </button>
                </td>
              )}

              {/* View */}
              <td className="px-5 py-3 text-center">
                <button
                  onClick={() => onView(project.id)}
                  className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors"
                  title="View project"
                >
                  <Eye size={15} />
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
