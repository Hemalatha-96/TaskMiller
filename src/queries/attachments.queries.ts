import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addAttachmentApi,
  listAttachmentsApi,
  getAttachmentDownloadUrlApi,
  deleteAttachmentApi
} from '../http/services/attachments.service'
import type { AddAttachmentBody } from '../types/task.types'
import type { ApiError } from '../types/api.types'

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const attachmentKeys = {
  all:       () => ['attachments'] as const,
  lists:     () => [...attachmentKeys.all(), 'list'] as const,
  list:      (taskId: string) => [...attachmentKeys.lists(), taskId] as const,
  downloads: () => [...attachmentKeys.all(), 'download'] as const,
  download:  (taskId: string, attachmentId: string) => [...attachmentKeys.downloads(), taskId, attachmentId] as const,
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useAttachments(taskId: string) {
  return useQuery({
    queryKey: attachmentKeys.list(taskId),
    queryFn:  () => listAttachmentsApi(taskId),
    enabled:  !!taskId,
  })
}

// Separate query hook for download URL (fetched on demand when a user clicks an attachment)
export function useAttachmentDownloadUrl(taskId: string, attachmentId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: attachmentKeys.download(taskId, attachmentId),
    queryFn:  () => getAttachmentDownloadUrlApi(taskId, attachmentId),
    enabled:  !!taskId && !!attachmentId && enabled,
    // Keep it cached but treat it as stale after 55 minutes since presigned URLs expire in 60 mins
    staleTime: 55 * 60 * 1000, 
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useAddAttachmentMutation(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation<any, ApiError, AddAttachmentBody>({
    mutationFn: (body) => addAttachmentApi(taskId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.list(taskId) })
    },
  })
}

export function useDeleteAttachmentMutation(taskId: string) {
  const queryClient = useQueryClient()

  return useMutation<{ message: string }, ApiError, string>({
    mutationFn: (attachmentId) => deleteAttachmentApi(taskId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.list(taskId) })
    },
  })
}
