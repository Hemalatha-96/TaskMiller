import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, getTaskById, createTask, updateTask, updateTaskStatus, deleteTask, createSubTask } from '../api/tasks.api'
import type { SubTaskInput } from '../api/tasks.api'
import { KEYS } from '../../constants/queryKeys'
import type { PaginationParams } from '../../types/api.types'
import type { Task, TaskStatus } from '../../types/task.types'

export function useTasks(params: PaginationParams & { projectId?: string; priority?: string; assigneeId?: string } = {}) {
  return useQuery({ queryKey: [...KEYS.TASKS, params], queryFn: () => getTasks(params) })
}

export function useTask(id: string) {
  return useQuery({ queryKey: KEYS.TASK(id), queryFn: () => getTaskById(id), enabled: !!id })
}

function invalidateAfterTaskMutation(qc: ReturnType<typeof useQueryClient>, taskId?: string) {
  qc.invalidateQueries({ queryKey: KEYS.TASKS })
  qc.invalidateQueries({ queryKey: KEYS.USERS })
  qc.invalidateQueries({ queryKey: KEYS.PROJECTS })
  if (taskId) qc.invalidateQueries({ queryKey: KEYS.TASK(taskId) })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => invalidateAfterTaskMutation(qc),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => updateTask(id, data),
    onSuccess: (_d, { id }) => invalidateAfterTaskMutation(qc, id),
  })
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => updateTaskStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: KEYS.TASKS })
      
      const previousTask = qc.getQueryData<Task>(KEYS.TASK(id))
      if (previousTask) {
        qc.setQueryData<Task>(KEYS.TASK(id), { ...previousTask, status })
      }

      const queryCache = qc.getQueriesData<any>({ queryKey: KEYS.TASKS })
      queryCache.forEach(([queryKey, oldData]) => {
        if (oldData && oldData.data && Array.isArray(oldData.data)) {
          qc.setQueryData(queryKey, {
            ...oldData,
            data: oldData.data.map((task: Task) => (task.id === id ? { ...task, status } : task))
          })
        }
      })

      return { previousTask }
    },
    onError: (err, { id }, context) => {
      if (context?.previousTask) {
        qc.setQueryData(KEYS.TASK(id), context.previousTask)
      }
      qc.invalidateQueries({ queryKey: KEYS.TASKS })
    },
    onSettled: (_d, _e, { id }) => {
      invalidateAfterTaskMutation(qc, id)
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => invalidateAfterTaskMutation(qc),
  })
}

export function useCreateSubTask(parentTaskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SubTaskInput) => createSubTask(parentTaskId, input),
    onSuccess: () => invalidateAfterTaskMutation(qc, parentTaskId),
  })
}
