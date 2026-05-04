import { useNavigate } from '@tanstack/react-router'
import AvatarStack from '../ui/AvatarStack'
import S3Image from '../ui/S3Image'
import { projectStatusBadge, getInitials } from '../../lib/utils'
import type { Project } from '../../types/project.types'

interface ProjectCardProps {
  project: Project
  index:   number
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

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const navigate = useNavigate()
  const color    = cardColors[index % cardColors.length]
  const initials = getInitials(project.title)
  const avatars  = project.members.map((m, i) => ({
    id:    m.id,
    name:  m.name,
    color: cardColors[(index + i + 1) % cardColors.length],
    avatarUrl: m.avatarUrl,
  }))

  return (
    <div
      onClick={() => navigate({ to: '/projects/$projectId', params: { projectId: project.id }, search: { view: undefined } })}
      className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-orange-100 cursor-pointer transition-all group"
    >
      {/* Logo */}
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 flex-shrink-0 relative overflow-hidden`}>
        {project.logoUrl ? (
          <S3Image storageKey={project.logoUrl} fallbackInitials={initials} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white font-bold text-sm">{initials}</span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1 group-hover:text-orange-500 transition-colors">
        {project.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed min-h-[2rem]">
        {project.description ?? 'No description provided.'}
      </p>

      {/* Footer: avatars + status */}
      <div className="flex items-center justify-between">
        {avatars.length > 0 ? (
          <AvatarStack avatars={avatars} max={4} size="sm" />
        ) : (
          <span className="text-xs text-gray-300">No members</span>
        )}
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${projectStatusBadge[project.status] ?? 'bg-gray-50 text-gray-500'}`}>
          {statusLabel[project.status] ?? project.status}
        </span>
      </div>
    </div>
  )
}
