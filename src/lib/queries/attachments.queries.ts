import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addAttachment, deleteAttachment, listAttachments } from '../api/attachments.api'
import type { AddAttachmentInput } from '../api/attachments.api'
import { KEYS } from '../../constants/queryKeys'

export function useAttachments(taskId: string) {
  return useQuery({
    queryKey: KEYS.ATTACHMENTS(taskId),
    queryFn: () => listAttachments(taskId),
    enabled: !!taskId,
  })
}

function invalidateAfterAttachmentMutation(qc: ReturnType<typeof useQueryClient>, taskId: string) {
  qc.invalidateQueries({ queryKey: KEYS.ATTACHMENTS(taskId) })
  qc.invalidateQueries({ queryKey: KEYS.TASK(taskId) })
  qc.invalidateQueries({ queryKey: KEYS.TASKS })
  qc.invalidateQueries({ queryKey: KEYS.PROJECTS })
}

export function useAddAttachment(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddAttachmentInput) => addAttachment(taskId, input),
    onSuccess: () => invalidateAfterAttachmentMutation(qc, taskId),
  })
}

export function useDeleteAttachment(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(taskId, attachmentId),
    onSuccess: () => invalidateAfterAttachmentMutation(qc, taskId),
  })
}

