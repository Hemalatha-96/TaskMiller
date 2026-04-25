import { apiClient } from './client'
import { unwrapBackendResponse } from './response'

export interface Comment {
  id: string
  taskId: string
  authorId: string
  authorName: string
  authorEmail: string
  authorAvatar?: string
  body: string
  createdAt: string
  parentCommentId?: string
  replies?: Comment[]
}

type ApiCommentAuthor = {
  id?: string
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
}

type ApiComment = {
  id: string
  taskId?: string
  authorId?: string
  body?: string
  createdAt?: string
  author?: ApiCommentAuthor | null
  parentCommentId?: string | null
  replies?: ApiComment[] | null
}

type CommentsListPayload = {
  comments?: ApiComment[]
  data?: ApiComment[]
  pagination?: unknown
}

function normalizeComment(c: ApiComment): Comment {
  return {
    id: c.id,
    taskId: c.taskId ?? '',
    authorId: c.authorId ?? c.author?.id ?? 'unknown',
    authorName: c.author?.name ?? 'Unknown',
    authorEmail: c.author?.email ?? '',
    authorAvatar: c.author?.avatarUrl ?? undefined,
    body: c.body ?? '',
    createdAt: c.createdAt ?? new Date().toISOString(),
    parentCommentId: c.parentCommentId ?? undefined,
    replies: c.replies?.map(normalizeComment) ?? undefined,
  }
}

export async function getComments(taskId: string): Promise<Comment[]> {
  const res = await apiClient.get(`/api/tasks/${taskId}/comments`)
  const data = unwrapBackendResponse<CommentsListPayload | ApiComment[]>(res.data)
  const list: ApiComment[] = Array.isArray(data) ? data : ((data as CommentsListPayload).comments ?? (data as CommentsListPayload).data ?? [])

  // Flatten nested replies (backend may embed replies inside parent or return flat list)
  const flat: Comment[] = []
  for (const c of list) {
    const parent = normalizeComment(c)
    flat.push(parent)
    if (c.replies?.length) {
      for (const r of c.replies) {
        flat.push(normalizeComment({ ...r, parentCommentId: r.parentCommentId ?? c.id }))
      }
    }
  }
  return flat
}

export async function addComment(taskId: string, body: string, parentCommentId?: string): Promise<Comment> {
  const payload: { body: string; parentCommentId?: string } = { body }
  if (parentCommentId) payload.parentCommentId = parentCommentId
  const res = await apiClient.post(`/api/tasks/${taskId}/comments`, payload)
  const data = unwrapBackendResponse<ApiComment>(res.data)
  return normalizeComment(data)
}

export async function editComment(taskId: string, commentId: string, body: string): Promise<Comment> {
  const res = await apiClient.patch(`/api/tasks/${taskId}/comments/${commentId}`, { body })
  const data = unwrapBackendResponse<ApiComment>(res.data)
  return normalizeComment(data)
}

export async function deleteComment(taskId: string, commentId: string): Promise<void> {
  await apiClient.delete(`/api/tasks/${taskId}/comments/${commentId}`)
}
