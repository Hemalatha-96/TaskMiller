import { get, post, del } from '../client'
import type {
  Attachment,
  AddAttachmentBody,
  AttachmentsResponse
} from '../../types/task.types'

export function addAttachmentApi(taskId: string, body: AddAttachmentBody) {
  return post<Attachment>(`/api/tasks/${taskId}/attachments`, body)
}

export function listAttachmentsApi(taskId: string) {
  return get<AttachmentsResponse>(`/api/tasks/${taskId}/attachments`)
}

export function getAttachmentDownloadUrlApi(taskId: string, attachmentId: string) {
  return get<{ url: string; expiresIn: number }>(`/api/tasks/${taskId}/attachments/${attachmentId}/url`)
}

export function deleteAttachmentApi(taskId: string, attachmentId: string) {
  return del<{ message: string }>(`/api/tasks/${taskId}/attachments/${attachmentId}`)
}
