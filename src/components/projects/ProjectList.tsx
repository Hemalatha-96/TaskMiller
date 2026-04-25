import { ProjectCard } from './ProjectCard'
import { EmptyState } from '../common/EmptyState'
import { FolderKanban } from 'lucide-react'
import type { Project } from '../../types/project.types'

interface ProjectListProps {
  projects: Project[]
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
}

export function ProjectList({ projects, onEdit, onDelete }: ProjectListProps) {
  if (projects.length === 0) {
    return <EmptyState title="No projects found" message="Create a new project to get started." icon={<FolderKanban className="w-12 h-12" />} />
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}
