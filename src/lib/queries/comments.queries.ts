import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getComments, addComment, editComment, deleteComment } from '../api/comments.api'
import { KEYS } from '../../constants/queryKeys'

export function useComments(taskId: string) {
  return useQuery({
    queryKey: KEYS.COMMENTS(taskId),
    queryFn: () => getComments(taskId),
    enabled: !!taskId,
  })
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ body, parentCommentId }: { body: string; parentCommentId?: string }) =>
      addComment(taskId, body, parentCommentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.COMMENTS(taskId) }),
  })
}

export function useEditComment(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) => editComment(taskId, commentId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.COMMENTS(taskId) }),
  })
}

export function useDeleteComment(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(taskId, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.COMMENTS(taskId) }),
  })
}
