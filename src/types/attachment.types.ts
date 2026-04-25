export interface Attachment {
  id: string
  taskId: string
  s3Key?: string
  fileName: string
  mimeType?: string
  size?: number
  url?: string
  createdAt: string
  uploadedById?: string
  uploadedByName?: string
}
