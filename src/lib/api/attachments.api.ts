import { apiClient } from './client'
import { getApiErrorMessage } from './error'
import { unwrapBackendResponse } from './response'
import { getPresignedUrl, uploadToPresignedUrl } from './uploads.api'
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_ERROR_MESSAGE } from '../../constants/uploads'
import type { Attachment } from '../../types/attachment.types'

export type AddAttachmentInput = {
  file: File
}

type ApiAttachmentUser = {
  id?: string
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
}

type ApiAttachment = {
  id?: string
  taskId?: string | null
  s3Key?: string | null
  fileName?: string | null
  filename?: string | null
  name?: string | null
  originalName?: string | null
  mimeType?: string | null
  mimetype?: string | null
  fileSize?: number | null
  size?: number | null
  url?: string | null
  downloadUrl?: string | null
  createdAt?: string | null
  created_at?: string | null
  uploadedById?: string | null
  uploadedByName?: string | null
  uploadedBy?: ApiAttachmentUser | null
  uploader?: ApiAttachmentUser | null
}

type AttachmentsListPayload =
  | ApiAttachment[]
  | {
      attachments?: ApiAttachment[]
      data?: ApiAttachment[]
      items?: ApiAttachment[]
      results?: ApiAttachment[]
      pagination?: unknown
    }

function normalizeAttachment(a: ApiAttachment, taskId: string, index: number): Attachment {
  const nowIso = new Date().toISOString()
  const fileName = a.fileName ?? a.filename ?? a.originalName ?? a.name ?? 'Attachment'
  const uploadedById =
    a.uploadedById ?? a.uploadedBy?.id ?? a.uploader?.id ?? undefined
  const uploadedByName =
    a.uploadedByName ?? a.uploadedBy?.name ?? a.uploader?.name ?? undefined

  return {
    id: a.id ?? `attachment_${taskId}_${index}`,
    taskId: a.taskId ?? taskId,
    s3Key: a.s3Key ?? undefined,
    fileName,
    mimeType: a.mimeType ?? a.mimetype ?? undefined,
    size: typeof a.fileSize === 'number' ? a.fileSize : typeof a.size === 'number' ? a.size : undefined,
    url: a.url ?? a.downloadUrl ?? undefined,
    createdAt: a.createdAt ?? a.created_at ?? nowIso,
    uploadedById,
    uploadedByName,
  }
}

function attachmentsBasePath(taskId: string): string {
  return `/api/tasks/${taskId}/attachments`
}

function attachmentPath(taskId: string, attachmentId: string): string {
  return `${attachmentsBasePath(taskId)}/${attachmentId}`
}

export async function listAttachments(taskId: string): Promise<Attachment[]> {
  const res = await apiClient.get(attachmentsBasePath(taskId))
  const data = unwrapBackendResponse<AttachmentsListPayload>(res.data)

  const list = Array.isArray(data)
    ? data
    : (data.attachments ?? data.data ?? data.items ?? data.results ?? [])

  return list.map((a, i) => normalizeAttachment(a, taskId, i))
}

export async function addAttachment(taskId: string, input: AddAttachmentInput): Promise<Attachment> {
  try {
    if (input.file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new Error(MAX_UPLOAD_SIZE_ERROR_MESSAGE)
    }

    const contentType = input.file.type || 'application/octet-stream'
    const { presignedUrl, key } = await getPresignedUrl({
      folder: 'attachments',
      fileName: input.file.name,
      contentType,
      fileSize: input.file.size,
    })

    await uploadToPresignedUrl(presignedUrl, input.file, contentType)

    const res = await apiClient.post(attachmentsBasePath(taskId), {
      s3Key: key,
      fileName: input.file.name,
      mimeType: contentType,
      fileSize: input.file.size,
    })

    const data = unwrapBackendResponse<any>(res.data)
    const attachment = (data?.attachment ?? data?.data ?? data) as ApiAttachment
    return normalizeAttachment(attachment, taskId, 0)
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}

export async function deleteAttachment(taskId: string, attachmentId: string): Promise<void> {
  try {
    await apiClient.delete(attachmentPath(taskId, attachmentId))
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}

export async function getAttachmentDownloadUrl(taskId: string, attachmentId: string): Promise<string> {
  try {
    const res = await apiClient.get(`${attachmentPath(taskId, attachmentId)}/url`)
    const data = unwrapBackendResponse<any>(res.data)
    const url = (typeof data?.url === 'string' ? data.url : undefined) ?? (typeof data === 'string' ? data : undefined)
    if (!url || !url.trim()) throw new Error('Missing attachment URL.')
    return url
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}
