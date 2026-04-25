import axios from 'axios'
import { apiClient } from './client'
import { getApiErrorMessage } from './error'
import { unwrapBackendResponse } from './response'

function sanitizeUploadFileName(fileName: string): string {
  const raw = String(fileName ?? '').trim()
  if (!raw) return 'file'

  const cleaned = raw.replace(/[/\\]+/g, '_')
  const dotIndex = cleaned.lastIndexOf('.')
  const base = dotIndex > 0 ? cleaned.slice(0, dotIndex) : cleaned
  const ext = dotIndex > 0 ? cleaned.slice(dotIndex + 1) : ''

  const safeBase = base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')

  const safeExt = ext.replace(/[^a-zA-Z0-9]+/g, '')
  const merged = safeExt ? `${safeBase || 'file'}.${safeExt}` : safeBase || 'file'
  return merged.slice(0, 180)
}

type PresignedUrlBaseInput = {
  fileName: string
  contentType: string
}

export type PresignedUrlInput = PresignedUrlBaseInput & {
  folder: string
  fileSize: number
}

export type PresignedUrlOutput = {
  presignedUrl: string
  key: string
}

type PresignedUrlResponse = {
  presignedUrl?: string | null
  url?: string | null
  key?: string | null
  s3Key?: string | null
}

export async function getPresignedUrl(input: PresignedUrlInput): Promise<PresignedUrlOutput> {
  try {
    const payload: PresignedUrlInput = { ...input, fileName: sanitizeUploadFileName(input.fileName) }
    const res = await apiClient.post('/api/uploads/presigned-url', payload)
    const data = unwrapBackendResponse<PresignedUrlResponse>(res.data)

    const presignedUrl = data?.presignedUrl ?? data?.url ?? undefined
    const key = data?.key ?? data?.s3Key ?? undefined

    if (!presignedUrl || !key) throw new Error('Invalid presigned URL response.')
    return { presignedUrl, key }
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}

export async function uploadToPresignedUrl(presignedUrl: string, file: File, contentType: string): Promise<void> {
  await axios.put(presignedUrl, file, { headers: { 'Content-Type': contentType } })
}

export type DownloadUrlOutput = {
  url: string
  expiresIn?: number
}

type DownloadUrlResponse = {
  url?: string | null
  downloadUrl?: string | null
  expiresIn?: number | null
}

export async function getDownloadUrl(key: string): Promise<DownloadUrlOutput> {
  try {
    const res = await apiClient.get('/api/uploads/download-url', { params: { key } })
    const data = unwrapBackendResponse<DownloadUrlResponse>(res.data)

    const url = data?.url ?? data?.downloadUrl ?? undefined
    if (!url) throw new Error('Invalid download URL response.')

    return { url, expiresIn: typeof data?.expiresIn === 'number' ? data.expiresIn : undefined }
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  }
}
