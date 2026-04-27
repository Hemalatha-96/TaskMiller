import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCommentsApi, addCommentApi, editCommentApi, deleteCommentApi } from '../http/services/comments.service'

const key = (taskId: string) => ['comments', taskId]

export function useComments(taskId: string) {
  return useQuery({
    queryKey: key(taskId),
    queryFn:  () => getCommentsApi(taskId),
    enabled:  !!taskId,
  })
}

export function useAddCommentMutation(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ body, parentCommentId }: { body: string; parentCommentId?: string }) =>
      addCommentApi(taskId, body, parentCommentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(taskId) }),
  })
}

export function useEditCommentMutation(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      editCommentApi(taskId, commentId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(taskId) }),
  })
}

export function useDeleteCommentMutation(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => deleteCommentApi(taskId, commentId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: key(taskId) }),
  })
}
