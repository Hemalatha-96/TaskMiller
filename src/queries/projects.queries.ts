import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProjectsApi, getProjectApi,
  createProjectApi, updateProjectApi, deleteProjectApi,
} from '../http/services/projects.service'
import { authStore } from '../store/auth.store'
import type { ProjectsParams, CreateProjectBody, UpdateProjectBody } from '../types/project.types'

// ─── GET /api/projects ────────────────────────────────────────────────────────

export function useProjects(params: ProjectsParams = {}) {
  return useQuery({
    queryKey:        ['projects', params],
    queryFn:         () => getProjectsApi(params),
    placeholderData: (prev) => prev,
    enabled:         !!authStore.state.accessToken,
  })
}

// ─── GET /api/projects/:id ────────────────────────────────────────────────────

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn:  () => getProjectApi(id),
    enabled:  !!id && !!authStore.state.accessToken,
  })
}

// ─── POST /api/projects ───────────────────────────────────────────────────────

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateProjectBody) => createProjectApi(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// ─── PATCH /api/projects/:id ──────────────────────────────────────────────────

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateProjectBody }) =>
      updateProjectApi(id, body),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// ─── DELETE /api/projects/:id ─────────────────────────────────────────────────

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProjectApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
