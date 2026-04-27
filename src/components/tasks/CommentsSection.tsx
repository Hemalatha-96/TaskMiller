import { useState, useRef } from 'react'
import { Send, Pencil, Trash2, Check, X, Reply, ChevronDown, ChevronUp } from 'lucide-react'
import { useComments, useAddCommentMutation, useEditCommentMutation, useDeleteCommentMutation } from '../../queries/comments.queries'
import { useUsers } from '../../queries/users.queries'
import { useOrgContext } from '../../store/orgContext.store'
import { useAuth } from '../../hooks/useAuth'
import { userColor } from '../../lib/utils'
import type { Comment, MentionUser } from '../../types/comment.types'

interface MentionCandidate { id: string; name: string; email: string }

interface CommentsSectionProps {
  taskId:     string
  userId:     string
  userName:   string
  avatarUrl?: string | null
  assignees?: MentionCandidate[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff   = Date.now() - new Date(iso).getTime()
  const secs   = Math.floor(diff / 1000)
  if (secs  < 60)  return 'just now'
  const mins   = Math.floor(secs  / 60)
  if (mins  < 60)  return `${mins}m ago`
  const hrs    = Math.floor(mins  / 60)
  if (hrs   < 24)  return `${hrs}h ago`
  const days   = Math.floor(hrs   / 24)
  if (days  < 30)  return `${days}d ago`
  const months = Math.floor(days  / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

const UUID_RE = /(@[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/g

function flattenReplies(replies: Comment[]): Comment[] {
  return replies.flatMap(r => [r, ...flattenReplies(r.replies ?? [])])
}

function renderBody(body: string, mentions: MentionUser[]) {
  const map   = Object.fromEntries(mentions.map(m => [m.id, m.name]))
  const parts = body.split(UUID_RE)
  return parts.map((part, i) => {
    const match = part.match(/^@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/)
    if (match && map[match[1]]) {
      return <span key={i} className="text-teal-600 font-semibold">@{map[match[1]]}</span>
    }
    return part
  })
}



import S3Image from '../ui/S3Image'

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, id, avatarUrl, small }: { name: string; id: string; avatarUrl?: string | null; small?: boolean }) {
  return (
    <div className={`${small ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'} ${userColor(id)} rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
      {avatarUrl ? (
        <S3Image storageKey={avatarUrl} fallbackInitials={name.charAt(0).toUpperCase()} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-semibold">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  )
}

// ─── MentionInput ─────────────────────────────────────────────────────────────

interface MentionInputProps {
  value:       string
  onChange:    (v: string) => void
  onSubmit:    () => void
  placeholder: string
  inputClass:  string
  candidates:  MentionCandidate[]
  autoFocus?:  boolean
}

function MentionInput({ value, onChange, onSubmit, placeholder, inputClass, candidates, autoFocus }: MentionInputProps) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [atPos,        setAtPos]        = useState(0)
  const [dropdownPos,  setDropdownPos]  = useState<{ bottom: number; left: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = mentionQuery !== null
    ? candidates.filter(c => c.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : []

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val    = e.target.value
    const cursor = e.target.selectionStart ?? val.length
    onChange(val)
    const before = val.slice(0, cursor)
    const match  = before.match(/@([^@\n]*)$/)
    if (match) {
      const rect = e.target.getBoundingClientRect()
      setDropdownPos({ bottom: window.innerHeight - rect.top + 4, left: Math.min(rect.left, window.innerWidth - 240) })
      setMentionQuery(match[1])
      setAtPos(before.lastIndexOf('@'))
    } else {
      setMentionQuery(null)
      setDropdownPos(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setMentionQuery(null); setDropdownPos(null); return }
    if (e.key === 'Enter' && !e.shiftKey && mentionQuery === null) {
      e.preventDefault()
      onSubmit()
    }
  }

  const pickMention = (user: MentionCandidate) => {
    const cursor  = inputRef.current?.selectionStart ?? value.length
    const newText = value.slice(0, atPos) + '@' + user.id + ' ' + value.slice(cursor)
    onChange(newText)
    setMentionQuery(null)
    setDropdownPos(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className="flex-1">
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full ${inputClass}`}
        autoFocus={autoFocus}
      />
      {mentionQuery !== null && filtered.length > 0 && dropdownPos && (
        <div
          style={{ position: 'fixed', bottom: dropdownPos.bottom, left: dropdownPos.left, width: 224, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-y-auto max-h-48"
        >
          {filtered.map(user => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); pickMention(user) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-teal-50 text-left transition-colors"
            >
              <div className={`w-6 h-6 rounded-full ${userColor(user.id)} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-xs font-semibold">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ReplyInput ───────────────────────────────────────────────────────────────

interface ReplyInputProps {
  userName:   string
  userId:     string
  avatarUrl?: string | null
  isAdding:   boolean
  candidates: MentionCandidate[]
  onSubmit:   (body: string) => void
  onCancel:   () => void
}

function ReplyInput({ userName, userId, avatarUrl, isAdding, candidates, onSubmit, onCancel }: ReplyInputProps) {
  const [text, setText] = useState('')

  const submit = () => {
    const t = text.trim()
    if (!t || isAdding) return
    onSubmit(t)
    setText('')
  }

  return (
    <div className="flex gap-2 items-center mt-2.5">
      <Avatar name={userName} id={userId} avatarUrl={avatarUrl} small />
      <div className="flex-1 flex items-center gap-2 border border-teal-300 rounded-xl px-3 py-1.5 bg-teal-50 focus-within:border-teal-400 transition-colors">
        <MentionInput
          value={text}
          onChange={setText}
          onSubmit={submit}
          placeholder="Write a reply..."
          inputClass="bg-transparent outline-none text-xs text-gray-700 placeholder-gray-400"
          candidates={candidates}
          autoFocus
        />
        <button
          onClick={submit}
          disabled={isAdding || !text.trim()}
          className="w-6 h-6 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
        >
          <Send size={11} className="text-white" />
        </button>
      </div>
      <button onClick={onCancel} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
        <X size={13} />
      </button>
    </div>
  )
}

// ─── ReplyRow ─────────────────────────────────────────────────────────────────

interface ReplyRowProps {
  reply:            Comment
  isOwn:            boolean
  isEditingThis:    boolean
  isEditing:        boolean
  editText:         string
  replyingTo:       string | null
  userId:           string
  userName:         string
  avatarUrl?:       string | null
  isAdding:         boolean
  candidates:       MentionCandidate[]
  onReply:          (id: string) => void
  onCancelReply:    () => void
  onSubmitReply:    (body: string) => void
  onEdit:           () => void
  onDelete:         () => void
  onCancelEdit:     () => void
  onEditTextChange: (v: string) => void
  onSaveEdit:       () => void
}

function ReplyRow({
  reply, isOwn, isEditingThis, isEditing, editText,
  replyingTo, userId, userName, avatarUrl, isAdding, candidates,
  onReply, onCancelReply, onSubmitReply,
  onEdit, onDelete, onCancelEdit, onEditTextChange, onSaveEdit,
}: ReplyRowProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="flex gap-2.5">
        <Avatar name={reply.author.name} id={reply.author.id} avatarUrl={reply.author.avatarUrl} small />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">{reply.author.name}</span>
              <span className="text-xs text-gray-400">{timeAgo(reply.createdAt)}</span>
              {reply.updatedAt !== reply.createdAt && <span className="text-xs text-gray-300 italic">edited</span>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onReply(reply.id)}
                className="flex items-center gap-1 text-xs font-medium text-teal-500 hover:text-teal-600 transition-colors"
              >
                <Reply size={11} /> Reply
              </button>
              {isOwn && hovered && !isEditingThis && (
                <>
                  <button onClick={onEdit} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-1">
                    <Pencil size={10} />
                  </button>
                  <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={10} />
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditingThis ? (
            <div className="mt-1">
              <textarea
                value={editText}
                onChange={(e) => onEditTextChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSaveEdit() } }}
                rows={2}
                autoFocus
                className="w-full border border-orange-300 rounded-lg px-3 py-2 text-xs outline-none resize-none focus:border-orange-400"
              />
              <div className="flex gap-2 mt-1.5">
                <button onClick={onSaveEdit} disabled={isEditing || !editText.trim()} className="flex items-center gap-1 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 px-2.5 py-1 rounded-lg disabled:opacity-50">
                  <Check size={10} /> Save
                </button>
                <button onClick={onCancelEdit} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <X size={10} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-600 leading-relaxed break-words mt-0.5">
              {renderBody(reply.body, reply.mentions ?? [])}
            </p>
          )}
        </div>
      </div>

      {/* Reply to reply input */}
      {replyingTo === reply.id && (
        <div className="ml-9 mt-1">
          <ReplyInput
            userName={userName}
            userId={userId}
            avatarUrl={avatarUrl}
            isAdding={isAdding}
            candidates={candidates}
            onSubmit={onSubmitReply}
            onCancel={onCancelReply}
          />
        </div>
      )}
    </div>
  )
}

// ─── CommentItem ──────────────────────────────────────────────────────────────

interface CommentItemProps {
  comment:          Comment
  replies:          Comment[]
  isOwn:            boolean
  userId:           string
  userName:         string
  avatarUrl?:       string | null
  candidates:       MentionCandidate[]
  replyingTo:       string | null
  editComment:      Comment | null
  editText:         string
  isAdding:         boolean
  isEditing:        boolean
  onReply:          (id: string) => void
  onCancelReply:    () => void
  onSubmitReply:    (body: string) => void
  onEdit:           (c: Comment) => void
  onCancelEdit:     () => void
  onEditTextChange: (v: string) => void
  onSaveEdit:       () => void
  onDelete:         (id: string) => void
}

function CommentItem({
  comment, replies, isOwn, userId, userName, avatarUrl, candidates,
  replyingTo, editComment, editText, isAdding, isEditing,
  onReply, onCancelReply, onSubmitReply,
  onEdit, onCancelEdit, onEditTextChange, onSaveEdit, onDelete,
}: CommentItemProps) {
  const [hovered,     setHovered]     = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const isEditingThis = editComment?.id === comment.id
  const allReplies    = flattenReplies(replies)

  return (
    <div>
      <div className="flex gap-3" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <Avatar name={comment.author.name} id={comment.author.id} avatarUrl={comment.author.avatarUrl} />
        <div className="flex-1 min-w-0">

          {/* Author + time + actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800">{comment.author.name}</span>
              <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
              {comment.updatedAt !== comment.createdAt && <span className="text-xs text-gray-300 italic">edited</span>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1 text-xs font-medium text-teal-500 hover:text-teal-600 transition-colors"
              >
                <Reply size={12} /> Reply
              </button>
              {isOwn && hovered && !isEditingThis && (
                <>
                  <button onClick={() => onEdit(comment)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-1">
                    <Pencil size={11} />
                  </button>
                  <button onClick={() => onDelete(comment.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Body or edit form */}
          {isEditingThis ? (
            <div className="mt-1">
              <textarea
                value={editText}
                onChange={(e) => onEditTextChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSaveEdit() } }}
                rows={2}
                autoFocus
                className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm outline-none resize-none focus:border-orange-400"
              />
              <div className="flex gap-2 mt-1.5">
                <button onClick={onSaveEdit} disabled={isEditing || !editText.trim()} className="flex items-center gap-1 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 px-2.5 py-1 rounded-lg disabled:opacity-50">
                  <Check size={11} /> Save
                </button>
                <button onClick={onCancelEdit} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <X size={11} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed break-words mt-0.5">
              {renderBody(comment.body, comment.mentions ?? [])}
            </p>
          )}

          {/* Inline reply input (for top-level comment) */}
          {replyingTo === comment.id && (
            <ReplyInput
              userName={userName}
              userId={userId}
              avatarUrl={avatarUrl}
              isAdding={isAdding}
              candidates={candidates}
              onSubmit={onSubmitReply}
              onCancel={onCancelReply}
            />
          )}

          {/* Replies toggle */}
          {allReplies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-teal-500 hover:text-teal-600 transition-colors"
            >
              {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showReplies ? 'Hide' : 'View'} {allReplies.length} {allReplies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {showReplies && allReplies.length > 0 && (
        <div className="ml-12 mt-3 space-y-3 pl-3 border-l-2 border-gray-100">
          {allReplies.map((reply) => (
            <ReplyRow
              key={reply.id}
              reply={reply}
              isOwn={reply.author.id === userId}
              isEditingThis={editComment?.id === reply.id}
              isEditing={isEditing}
              editText={editText}
              replyingTo={replyingTo}
              userId={userId}
              userName={userName}
              avatarUrl={avatarUrl}
              isAdding={isAdding}
              candidates={candidates}
              onReply={onReply}
              onCancelReply={onCancelReply}
              onSubmitReply={onSubmitReply}
              onEdit={() => onEdit(reply)}
              onDelete={() => onDelete(reply.id)}
              onCancelEdit={onCancelEdit}
              onEditTextChange={onEditTextChange}
              onSaveEdit={onSaveEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── CommentsSection ──────────────────────────────────────────────────────────

export default function CommentsSection({ taskId, userId, userName, avatarUrl, assignees = [] }: CommentsSectionProps) {
  const [text,        setText]        = useState('')
  const [editComment, setEditComment] = useState<Comment | null>(null)
  const [editText,    setEditText]    = useState('')
  const [replyingTo,  setReplyingTo]  = useState<string | null>(null)
  const listRef                       = useRef<HTMLDivElement>(null)

  const { isSuperAdmin, isAdmin }    = useAuth()
  const { selectedOrg }     = useOrgContext()

  const { data, isLoading } = useComments(taskId)
  const { data: usersData  } = useUsers(
    {
      status: 'active',
      limit:  100,
      orgId:  isSuperAdmin && selectedOrg ? selectedOrg.id : undefined,
    },
    { enabled: isAdmin },
  )
  const { mutate: addComment,    isPending: isAdding  } = useAddCommentMutation(taskId)
  const { mutate: editCommentFn, isPending: isEditing } = useEditCommentMutation(taskId)
  const { mutate: deleteComment                       } = useDeleteCommentMutation(taskId)

  const topLevel  = data?.comments ?? []

  const fetchedUsers: MentionCandidate[] = (usersData?.users ?? []).map(u => ({ id: u.id, name: u.name, email: u.email }))
  const seen       = new Set(fetchedUsers.map(u => u.id))
  const candidates = [...fetchedUsers, ...assignees.filter(a => !seen.has(a.id))]

  const handleAdd = () => {
    const trimmed = text.trim()
    if (!trimmed || isAdding) return
    addComment({ body: trimmed }, { onSuccess: () => setText('') })
  }

  const handleReplySubmit = (body: string) => {
    if (!replyingTo) return
    addComment({ body, parentCommentId: replyingTo }, { onSuccess: () => setReplyingTo(null) })
  }

  const handleEdit = () => {
    if (!editComment || !editText.trim() || isEditing) return
    editCommentFn(
      { commentId: editComment.id, body: editText.trim() },
      { onSuccess: () => { setEditComment(null); setEditText('') } },
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-800">Comments</h3>
          {topLevel.length > 0 && (
            <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
              {topLevel.length}
            </span>
          )}
        </div>
        <button className="px-3 py-1.5 text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors">
          Check Activity
        </button>
      </div>

      {/* Comment list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : topLevel.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No comments yet. Be the first!</p>
        ) : (
          topLevel.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={c.replies ?? []}
              isOwn={c.author.id === userId}
              userId={userId}
              userName={userName}
              avatarUrl={avatarUrl}
              candidates={candidates}
              replyingTo={replyingTo}
              editComment={editComment}
              editText={editText}
              isAdding={isAdding}
              isEditing={isEditing}
              onReply={(id) => setReplyingTo(replyingTo === id ? null : id)}
              onCancelReply={() => setReplyingTo(null)}
              onSubmitReply={handleReplySubmit}
              onEdit={(c) => { setEditComment(c); setEditText(c.body) }}
              onCancelEdit={() => { setEditComment(null); setEditText('') }}
              onEditTextChange={setEditText}
              onSaveEdit={handleEdit}
              onDelete={(id) => deleteComment(id)}
            />
          ))
        )}
      </div>

      {/* Add comment */}
      <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-3 items-center">
          <Avatar name={userName} id={userId} avatarUrl={avatarUrl} />
          <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-2xl px-4 py-2.5 bg-gray-50 focus-within:border-orange-400 transition-colors">
            <MentionInput
              value={text}
              onChange={setText}
              onSubmit={handleAdd}
              placeholder="Add a comment... (type @ to mention)"
              inputClass="bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
              candidates={candidates}
            />
            <button
              onClick={handleAdd}
              disabled={isAdding || !text.trim()}
              className="w-9 h-9 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
