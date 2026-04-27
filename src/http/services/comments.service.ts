import { get, post, patch, del } from '../client'
import type { Comment, CommentListResponse } from '../../types/comment.types'

export const getCommentsApi = (taskId: string): Promise<CommentListResponse> =>
  get<CommentListResponse>(`/api/tasks/${taskId}/comments`)

export const addCommentApi = (taskId: string, body: string, parentCommentId?: string): Promise<Comment> =>
  post<Comment>(`/api/tasks/${taskId}/comments`, { body, ...(parentCommentId ? { parentCommentId } : {}) })

export const editCommentApi = (taskId: string, commentId: string, body: string): Promise<Comment> =>
  patch<Comment>(`/api/tasks/${taskId}/comments/${commentId}`, { body })

export const deleteCommentApi = (taskId: string, commentId: string): Promise<{ message: string }> =>
  del<{ message: string }>(`/api/tasks/${taskId}/comments/${commentId}`)
