import { get, post } from '../client'

export function getPresignedUrlApi(folder: string, fileName: string, contentType: string, fileSize: number) {
  return post<{ presignedUrl: string; key: string }>('/api/uploads/presigned-url', { folder, fileName, contentType, fileSize })
}

export function getDownloadUrlApi(key: string) {
  return get<{ url: string; expiresIn: number }>(`/api/uploads/download-url?key=${encodeURIComponent(key)}`)
}

export async function uploadToS3(presignedUrl: string, file: File): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!res.ok) throw new Error('S3 upload failed')
}
