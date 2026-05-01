import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTasksApi, getTaskApi,
  createTaskApi, updateTaskApi, deleteTaskApi,
} from '../http/services/tasks.service'
import { authStore } from '../store/auth.store'
import type { TasksParams, CreateTaskBody, UpdateTaskBody } from '../types/task.types'

// ─── GET /api/tasks ───────────────────────────────────────────────────────────

export function useTasks(params: TasksParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey:        ['tasks', params],
    queryFn:         () => getTasksApi(params),
    placeholderData: (prev) => prev,
    enabled:         (options?.enabled ?? true) && !!authStore.state.accessToken,
  })
}

// ─── GET /api/tasks/:id ───────────────────────────────────────────────────────

export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn:  () => getTaskApi(id),
    enabled:  !!id && !!authStore.state.accessToken,
  })
}

// ─── POST /api/tasks ──────────────────────────────────────────────────────────

export function useCreateTaskMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTaskBody) => createTaskApi(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────────────────

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTaskBody }) =>
      updateTaskApi(id, body),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTaskApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
