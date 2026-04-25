import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, getProjectById, createProject, updateProject, deleteProject } from '../api/projects.api'
import { KEYS } from '../../constants/queryKeys'
import type { PaginationParams } from '../../types/api.types'
import type { Project } from '../../types/project.types'

export function useProjects(params: PaginationParams & { memberId?: string } = {}) {
  return useQuery({ queryKey: [...KEYS.PROJECTS, params], queryFn: () => getProjects(params) })
}

export function useProject(id: string) {
  return useQuery({ queryKey: KEYS.PROJECT(id), queryFn: () => getProjectById(id), enabled: !!id })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.PROJECTS }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) => updateProject(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.PROJECTS })
      qc.invalidateQueries({ queryKey: KEYS.PROJECT(id) })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.PROJECTS }),
  })
}
