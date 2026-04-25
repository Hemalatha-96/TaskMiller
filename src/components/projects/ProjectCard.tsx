import { Link } from '@tanstack/react-router'
import { Eye, FolderKanban, Users, Pencil, Trash2 } from 'lucide-react'
import { AvatarGroup } from '../ui/avatar'
import { getProjectStatusColor } from '../../utils/status'
import { PROJECT_STATUS_LABELS } from '../../constants/enums'
import { cn } from '../../utils/cn'
import { UploadedImage } from '../common/UploadedImage'
import type { Project } from '../../types/project.types'

interface ProjectCardProps {
  project: Project
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-orange-200 transition-all h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <UploadedImage
            value={project.logo}
            alt={`${project.title} logo`}
            fallback={<FolderKanban className="w-5 h-5 text-[#F4622A]" />}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getProjectStatusColor(project.status))}>
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="p-1 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 transition"
            title="View"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
          {onEdit && (
            <button
              onClick={() => onEdit(project)}
              className="p-1 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(project)}
              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <Link to="/projects/$projectId" params={{ projectId: project.id }} className="group">
        <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#F4622A] transition-colors mb-1 line-clamp-1">{project.title}</h3>
      </Link>
      {project.orgName && (
        <p className="text-xs font-medium text-[#F4622A] mb-2">{project.orgName}</p>
      )}
      <p className="text-xs text-gray-500 line-clamp-2 flex-1 mb-4">{project.description}</p>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <AvatarGroup names={project.members.map((m) => m.name)} max={3} size="xs" />
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Users className="w-3 h-3" />{project.members.length}
          </span>
        </div>

      </div>
    </div>
  )
}
