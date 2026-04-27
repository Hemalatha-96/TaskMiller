export interface CommentAuthor {
  id:        string
  name:      string
  email:     string
  avatarUrl: string | null
}

export interface MentionUser {
  id:        string
  name:      string
  email:     string
  avatarUrl: string | null
}

export interface Comment {
  id:              string
  taskId:          string
  authorId:        string
  parentCommentId: string | null
  body:            string
  createdAt:       string
  updatedAt:       string
  deletedAt:       string | null
  author:          CommentAuthor
  mentions:        MentionUser[]
  replies:         Comment[]
}

export interface CommentListResponse {
  comments:   Comment[]
  pagination: {
    currentPage:  number
    limit:        number
    totalRecords: number
    totalPages:   number
    hasNextPage:  boolean
    hasPrevPage:  boolean
  }
}
