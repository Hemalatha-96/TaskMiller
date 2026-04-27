import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import { ChevronLeft, Calendar, Paperclip, MessageSquare, CheckSquare, Trash2, Pencil, Check, X, Plus, Eye, CornerDownRight } from 'lucide-react'
import { useProject } from '../../../lib/queries/projects.queries'
import { useTask, useUpdateTaskStatus, useCreateSubTask } from '../../../lib/queries/tasks.queries'
import { useComments, useAddComment, useEditComment, useDeleteComment } from '../../../lib/queries/comments.queries'
import { useAttachments, useAddAttachment, useDeleteAttachment } from '../../../lib/queries/attachments.queries'
import { useOrgMembers } from '../../../lib/queries/orgs.queries'
import { Avatar, AvatarGroup } from '../../../components/ui/avatar'
import { TaskPriorityBadge } from '../../../components/tasks/TaskPriorityBadge'
import { TaskStatusSelect } from '../../../components/tasks/TaskStatusSelect'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { formatDate, timeAgo } from '../../../utils/date'
import { useAuth } from '../../../hooks/useAuth'
import { useOrgStore } from '../../../store/org.store'
import { getTaskStatusColor } from '../../../utils/status'
import { TASK_STATUS_LABELS } from '../../../constants/enums'
import { cn } from '../../../utils/cn'
import type { TaskStatus } from '../../../types/task.types'
import { getAttachmentDownloadUrl } from '../../../lib/api/attachments.api'
import type { Attachment } from '../../../types/attachment.types'
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_ERROR_MESSAGE } from '../../../constants/uploads'

type MentionUser = { id: string; name: string }

function AttachmentImage({ taskId, attachment, onClick }: { taskId: string, attachment: Attachment, onClick: () => void }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    getAttachmentDownloadUrl(taskId, attachment.id)
      .then(u => { if (mounted) setUrl(u) })
      .catch(() => { if (mounted) setError(true) })
    return () => { mounted = false }
  }, [taskId, attachment.id])

  const isImage = attachment.mimeType?.startsWith('image/') || attachment.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  if (!isImage || error) {
    return (
      <div onClick={onClick} className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center cursor-pointer flex-shrink-0 border border-gray-200 hover:bg-gray-200 transition">
        <Paperclip className="w-5 h-5 text-gray-400" />
      </div>
    )
  }

  return (
    <div onClick={onClick} className="w-12 h-12 rounded overflow-hidden cursor-pointer flex-shrink-0 border border-gray-200 hover:opacity-80 transition group relative bg-gray-100">
      {url ? (
        <img src={url} alt={attachment.fileName} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <Eye className="w-4 h-4 text-white" />
      </div>
    </div>
  )
}

function getMentionInfo(value: string, cursor: number): { query: string; start: number } | null {
  const textBefore = value.slice(0, cursor)
  const match = textBefore.match(/(?:^|\s)@([a-zA-Z0-9_ -]*)$/)
  if (!match) return null
  const matchedText = match[0]
  const atIndex = matchedText.indexOf('@')
  return { query: match[1], start: cursor - matchedText.length + atIndex }
}

function renderMentions(body: string, users: MentionUser[]) {
  const parts = body.split(/(@[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/g)
  return parts.map((part, i) => {
    if (/^@[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(part)) {
      const user = users.find((u) => u.id === part.slice(1))
      return (
        <span key={i} className="text-[#F4622A] font-medium">
          @{user?.name ?? part.slice(1, 13) + '…'}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export const Route = createFileRoute('/_dashboard/tasks/$taskId')({
  component: TaskDetailPage,
})

function TaskDetailPage() {
  const { taskId } = Route.useParams()
  const { data: task, isLoading, error } = useTask(taskId)
  const updateStatus = useUpdateTaskStatus()
  const { data: comments = [], isLoading: commentsLoading } = useComments(taskId)
  const addComment = useAddComment(taskId)
  const editComment = useEditComment(taskId)
  const deleteComment = useDeleteComment(taskId)
  const { data: attachments, isLoading: attachmentsLoading } = useAttachments(taskId)
  const addAttachment = useAddAttachment(taskId)
  const deleteAttachment = useDeleteAttachment(taskId)
  const { user: currentUser, orgId, isSuperAdmin } = useAuth()
  const { activeOrgId } = useOrgStore()
  const effectiveOrgId = isSuperAdmin ? (activeOrgId ?? undefined) : (orgId ?? undefined)
  const { data: projectData } = useProject(task?.projectId ?? '')
  const mentionOrgId = projectData?.orgId || effectiveOrgId || ''
  const { data: orgMembers = [], isLoading: membersLoading } = useOrgMembers(mentionOrgId)
  const orgUsers: MentionUser[] = orgMembers.map((m) => ({ id: m.userId, name: m.name }))

  const createSubTask = useCreateSubTask(taskId)

  const [commentBody, setCommentBody] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const editInputRef = useRef<HTMLTextAreaElement>(null)
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [attachmentError, setAttachmentError] = useState('')
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)
  const replyInputRef = useRef<HTMLInputElement>(null)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionAnchor, setMentionAnchor] = useState(0)
  const [replyMentionQuery, setReplyMentionQuery] = useState<string | null>(null)
  const [replyMentionAnchor, setReplyMentionAnchor] = useState(0)

  const [showSubtaskForm, setShowSubtaskForm] = useState(false)
  const [subtaskRows, setSubtaskRows] = useState([{ title: '', priority: 'medium', status: 'to_do', dueDate: '' }])
  const [subtaskError, setSubtaskError] = useState('')

  const addSubtaskRow = () =>
    setSubtaskRows((rows) => [...rows, { title: '', priority: 'medium', status: 'to_do', dueDate: '' }])

  const removeSubtaskRow = (i: number) =>
    setSubtaskRows((rows) => rows.filter((_, idx) => idx !== i))

  const updateSubtaskRow = (i: number, field: string, value: string) =>
    setSubtaskRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))

  const handleSubmitSubtasks = async () => {
    const valid = subtaskRows.filter((r) => r.title.trim())
    if (!valid.length) { setSubtaskError('Add at least one subtask title.'); return }
    setSubtaskError('')
    try {
      await Promise.all(valid.map((r) => createSubTask.mutateAsync({
        title: r.title.trim(),
        priority: r.priority as any,
        status: r.status as any,
        dueDate: r.dueDate || undefined,
        projectId: task?.projectId,
      })))
      setSubtaskRows([{ title: '', priority: 'medium', status: 'to_do', dueDate: '' }])
      setShowSubtaskForm(false)
    } catch (err: any) {
      setSubtaskError(err?.message ?? 'Failed to create subtasks.')
    }
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCommentBody(val)
    const cursor = e.target.selectionStart ?? val.length
    const info = getMentionInfo(val, cursor)
    if (info) { setMentionQuery(info.query); setMentionAnchor(info.start) }
    else setMentionQuery(null)
  }

  const handleSelectMention = (user: MentionUser) => {
    const before = commentBody.slice(0, mentionAnchor)
    const after = commentBody.slice(mentionAnchor + 1 + (mentionQuery?.length ?? 0))
    setCommentBody(`${before}@${user.id} ${after}`)
    setMentionQuery(null)
    setTimeout(() => commentInputRef.current?.focus(), 0)
  }

  const handleReplyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setReplyBody(val)
    const cursor = e.target.selectionStart ?? val.length
    const info = getMentionInfo(val, cursor)
    if (info) { setReplyMentionQuery(info.query); setReplyMentionAnchor(info.start) }
    else setReplyMentionQuery(null)
  }

  const handleSelectReplyMention = (user: MentionUser) => {
    const before = replyBody.slice(0, replyMentionAnchor)
    const after = replyBody.slice(replyMentionAnchor + 1 + (replyMentionQuery?.length ?? 0))
    setReplyBody(`${before}@${user.id} ${after}`)
    setReplyMentionQuery(null)
    setTimeout(() => replyInputRef.current?.focus(), 0)
  }

  const mentionUsers = mentionQuery !== null
    ? orgUsers.filter((u) => u.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 8)
    : []

  const replyMentionUsers = replyMentionQuery !== null
    ? orgUsers.filter((u) => u.name.toLowerCase().includes(replyMentionQuery.toLowerCase())).slice(0, 8)
    : []

  const handleAddComment = async () => {
    const body = commentBody.trim()
    if (!body) return
    await addComment.mutateAsync({ body })
    setCommentBody('')
    setMentionQuery(null)
  }

  const handleReply = async (parentCommentId: string) => {
    const body = replyBody.trim()
    if (!body) return
    await addComment.mutateAsync({ body, parentCommentId })
    setReplyBody('')
    setReplyingToId(null)
    setReplyMentionQuery(null)
  }

  const startEdit = (id: string, body: string) => {
    setEditingId(id)
    setEditBody(body)
    setTimeout(() => editInputRef.current?.focus(), 50)
  }

  const handleEdit = async (commentId: string) => {
    const body = editBody.trim()
    if (!body) return
    await editComment.mutateAsync({ commentId, body })
    setEditingId(null)
  }

  const handleSelectAttachment = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAttachmentError('')
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setAttachmentError(MAX_UPLOAD_SIZE_ERROR_MESSAGE)
      e.target.value = ''
      return
    }
    try {
      await addAttachment.mutateAsync({ file })
    } catch (err: any) {
      setAttachmentError(err?.message ?? 'Failed to upload attachment.')
    } finally {
      e.target.value = ''
    }
  }

  const handleDownloadAttachment = async (attachmentId: string) => {
    setAttachmentError('')
    try {
      const url = await getAttachmentDownloadUrl(taskId, attachmentId)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err: any) {
      setAttachmentError(err?.message ?? 'Failed to open attachment.')
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    setAttachmentError('')
    try {
      await deleteAttachment.mutateAsync(attachmentId)
    } catch (err: any) {
      setAttachmentError(err?.message ?? 'Failed to delete attachment.')
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-7xl font-extrabold text-gray-100 mb-4 select-none">404</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Task Not Found</h2>
        <p className="text-sm text-gray-400 mb-6">This task may have been deleted or doesn't exist.</p>
        <Link
          to="/tasks"
          search={{ q: undefined, status: undefined, projectId: undefined, priority: undefined, page: undefined }}
          className="inline-flex items-center gap-2 bg-[#F4622A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#E05520] transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Tasks
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6 pb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/tasks" search={{ q: undefined, status: undefined, projectId: undefined, priority: undefined, page: undefined }} className="flex items-center gap-1 hover:text-[#F4622A] transition">
          <ChevronLeft className="w-4 h-4" />
          Tasks
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{task.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Task Header */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-base font-bold text-gray-900">{task.name}</h1>
              <div className="flex items-center gap-2 flex-shrink-0">
                <TaskStatusSelect
                  value={task.status}
                  onChange={(status: TaskStatus) => updateStatus.mutate({ id: task.id, status })}
                  dueDate={task.dueDate}
                />
                <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
                  Check Activity
                </button>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Project:</span>
                <Link to="/projects/$projectId" params={{ projectId: task.projectId }} className="font-medium text-[#F4622A] hover:underline">{task.projectName}</Link>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Due: {formatDate(task.dueDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-gray-400" />
                <span>{attachments?.length ?? task.attachments} attachments</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {task.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">{tag}</span>
              ))}
              <TaskPriorityBadge priority={task.priority} />
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{task.description || 'No description provided.'}</p>
            </div>
          </div>

          {/* Subtasks */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#F4622A]" />
                Subtasks ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
              </h3>
              <button
                onClick={() => { setShowSubtaskForm((v) => !v); setSubtaskError(''); setSubtaskRows([{ title: '', priority: 'medium', status: 'to_do', dueDate: '' }]) }}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#F4622A] hover:bg-orange-50 px-2 py-1 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />Add Subtask
              </button>
            </div>

            {task.subtasks.length > 0 && (
              <div className="space-y-3 mb-4">
                {task.subtasks.map((sub) => (
                  <div key={sub.id} className="border border-gray-100 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
                    {/* Card header: title + priority */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-gray-800 leading-snug">{sub.name}</h4>
                      {sub.priority && <TaskPriorityBadge priority={sub.priority} />}
                    </div>

                    {/* Description */}
                    {sub.description && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{sub.description}</p>
                    )}

                    {/* Status + Assignees row */}
                    <div className="flex items-center justify-between mb-3">
                      {sub.status && (
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', getTaskStatusColor(sub.status))}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {TASK_STATUS_LABELS[sub.status]}
                        </span>
                      )}
                      {sub.assignees && sub.assignees.length > 0 && (
                        <AvatarGroup names={sub.assignees.map((a) => a.name)} max={4} size="xs" />
                      )}
                    </div>

                    {/* Due date + Actions */}
                    <div className="flex items-center justify-between">
                      {sub.dueDate ? (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Due Date</p>
                          <p className="text-xs font-medium text-gray-700">{formatDate(sub.dueDate)}</p>
                        </div>
                      ) : <div />}
                      <div className="flex items-center gap-1.5">
                        <Link
                          to="/tasks/$taskId"
                          params={{ taskId: sub.id }}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-[#F4622A] hover:border-orange-200 transition"
                          title="View subtask"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {task.subtasks.length === 0 && !showSubtaskForm && (
              <p className="text-sm text-gray-400 mb-2">No subtasks yet.</p>
            )}

            {/* Dynamic Subtask Form */}
            {showSubtaskForm && (
              <div className="border border-gray-200 rounded-xl p-4 mt-2 space-y-3 bg-gray-50">
                {subtaskError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{subtaskError}</p>
                )}
                {subtaskRows.map((row, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{i + 1}.</span>
                    <input
                      value={row.title}
                      onChange={(e) => updateSubtaskRow(i, 'title', e.target.value)}
                      placeholder="Subtask title"
                      className="flex-1 min-w-[160px] rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#F4622A] focus:ring-1 focus:ring-[#F4622A]/20 bg-white"
                    />
                    <select
                      value={row.status}
                      onChange={(e) => updateSubtaskRow(i, 'status', e.target.value)}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-[#F4622A]"
                    >
                      <option value="to_do">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                    <select
                      value={row.priority}
                      onChange={(e) => updateSubtaskRow(i, 'priority', e.target.value)}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-[#F4622A]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <input
                      type="date"
                      value={row.dueDate}
                      onChange={(e) => updateSubtaskRow(i, 'dueDate', e.target.value)}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-[#F4622A]"
                    />
                    {subtaskRows.length > 1 && (
                      <button onClick={() => removeSubtaskRow(i)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={addSubtaskRow}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#F4622A] transition"
                  >
                    <Plus className="w-3.5 h-3.5" />Add another
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setShowSubtaskForm(false); setSubtaskError('') }}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitSubtasks}
                      disabled={createSubTask.isPending}
                      className="px-3 py-1.5 text-xs rounded-lg bg-[#F4622A] text-white hover:bg-[#E05520] transition disabled:opacity-60"
                    >
                      {createSubTask.isPending ? 'Saving…' : 'Save Subtasks'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[#F4622A]" />
                Attachments ({attachments?.length ?? task.attachments})
              </h3>
              <div className="flex items-center gap-2">
                <input ref={attachmentInputRef} type="file" onChange={handleSelectAttachment} className="hidden" />
                <button
                  onClick={() => attachmentInputRef.current?.click()}
                  disabled={addAttachment.isPending}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#F4622A] hover:bg-orange-50 px-2 py-1 rounded-lg transition disabled:opacity-60"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {addAttachment.isPending ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>

            {attachmentError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">{attachmentError}</p>
            )}

            {attachmentsLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-2">
                {!attachments?.length ? (
                  <p className="text-sm text-gray-400 text-center py-4">No attachments yet.</p>
                ) : (
                  attachments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AttachmentImage taskId={taskId} attachment={a} onClick={() => handleDownloadAttachment(a.id)} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate" title={a.fileName}>{a.fileName}</p>
                          <p className="text-xs text-gray-400">
                            {(a.uploadedByName ? `${a.uploadedByName} - ` : '') + timeAgo(a.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleDownloadAttachment(a.id)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-[#F4622A] hover:border-orange-200 transition"
                          title="Download"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAttachment(a.id)}
                          disabled={deleteAttachment.isPending}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition disabled:opacity-60"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#F4622A]" />
              Comments ({comments.length})
            </h3>

            {commentsLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-4">
                {comments.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first to comment!</p>
                )}
                {comments.filter((c) => !c.parentCommentId).map((comment) => {
                  const replies = comments.filter((c) => c.parentCommentId === comment.id)
                  return (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex gap-3">
                        <Avatar name={comment.authorName} src={comment.authorAvatar} size="sm" className="flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          {editingId === comment.id ? (
                            <div className="bg-gray-50 rounded-xl px-4 py-3">
                              <textarea
                                ref={editInputRef}
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                rows={2}
                                className="w-full text-sm bg-transparent resize-none focus:outline-none text-gray-800"
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => handleEdit(comment.id)}
                                  disabled={editComment.isPending}
                                  className="p-1 rounded text-green-600 hover:bg-green-50 transition"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingId(null)} className="p-1 rounded text-gray-400 hover:bg-gray-100 transition">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-xl px-4 py-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-gray-800">{comment.authorName}</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
                                  <button
                                    onClick={() => { setReplyingToId(replyingToId === comment.id ? null : comment.id); setReplyBody('') }}
                                    className="p-1 rounded text-gray-400 hover:text-[#F4622A] hover:bg-orange-50 transition"
                                    title="Reply"
                                  >
                                    <CornerDownRight className="w-3 h-3" />
                                  </button>
                                  {currentUser?.id === comment.authorId && (
                                    <>
                                      <button onClick={() => startEdit(comment.id, comment.body)} className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition">
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => deleteComment.mutate(comment.id)}
                                        disabled={deleteComment.isPending}
                                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">{renderMentions(comment.body, orgUsers)}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Inline reply input */}
                      {replyingToId === comment.id && (
                        <div className="ml-10 flex gap-2">
                          <Avatar name={currentUser?.name ?? 'You'} size="xs" className="flex-shrink-0 mt-1" />
                          <div className="flex-1 flex gap-2">
                            <div className="flex-1 relative">
                              <input
                                ref={replyInputRef}
                                autoFocus
                                value={replyBody}
                                onChange={handleReplyChange}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey && replyMentionQuery === null) { e.preventDefault(); handleReply(comment.id) }
                                  if (e.key === 'Escape') { if (replyMentionQuery !== null) setReplyMentionQuery(null); else { setReplyingToId(null); setReplyBody('') } }
                                }}
                                placeholder={`Reply to ${comment.authorName}... (@ to mention)`}
                                className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#F4622A]"
                              />
                              {replyMentionQuery !== null && (
                                <div className="absolute bottom-full left-0 mb-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 max-h-40 overflow-y-auto">
                                  {membersLoading ? (
                                    <div className="px-3 py-2 text-xs text-gray-500 text-center">Loading users...</div>
                                  ) : replyMentionUsers.length > 0 ? replyMentionUsers.map((user) => (
                                    <button
                                      key={user.id}
                                      onMouseDown={(e) => { e.preventDefault(); handleSelectReplyMention(user) }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-orange-50 flex items-center gap-2 transition-colors"
                                    >
                                      <Avatar name={user.name} size="xs" />
                                      <span className="text-xs text-gray-800">{user.name}</span>
                                    </button>
                                  )) : (
                                    <div className="px-3 py-2 text-xs text-gray-500 text-center">No users found</div>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleReply(comment.id)}
                              disabled={addComment.isPending || !replyBody.trim()}
                              className="px-3 py-1.5 rounded-xl bg-[#F4622A] text-white text-xs hover:bg-[#E05520] transition disabled:opacity-50"
                            >
                              Reply
                            </button>
                            <button
                              onClick={() => { setReplyingToId(null); setReplyBody(''); setReplyMentionQuery(null) }}
                              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Nested replies */}
                      {replies.length > 0 && (
                        <div className="ml-10 space-y-2">
                          {replies.map((reply) => (
                            <div key={reply.id} className="flex gap-3">
                              <Avatar name={reply.authorName} src={reply.authorAvatar} size="xs" className="flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                {editingId === reply.id ? (
                                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                                    <textarea
                                      ref={editingId === reply.id ? editInputRef : undefined}
                                      value={editBody}
                                      onChange={(e) => setEditBody(e.target.value)}
                                      rows={2}
                                      className="w-full text-sm bg-transparent resize-none focus:outline-none text-gray-800"
                                    />
                                    <div className="flex items-center gap-2 mt-1">
                                      <button onClick={() => handleEdit(reply.id)} disabled={editComment.isPending} className="p-1 rounded text-green-600 hover:bg-green-50 transition"><Check className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => setEditingId(null)} className="p-1 rounded text-gray-400 hover:bg-gray-100 transition"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-blue-50/50 rounded-xl px-3 py-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-semibold text-gray-800">{reply.authorName}</span>
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-400">{timeAgo(reply.createdAt)}</span>
                                        {currentUser?.id === reply.authorId && (
                                          <>
                                            <button onClick={() => startEdit(reply.id, reply.body)} className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition"><Pencil className="w-3 h-3" /></button>
                                            <button onClick={() => deleteComment.mutate(reply.id)} disabled={deleteComment.isPending} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition"><Trash2 className="w-3 h-3" /></button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-600">{renderMentions(reply.body, orgUsers)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add comment */}
            <div className="mt-4 flex gap-3">
              <Avatar name={currentUser?.name ?? 'You'} size="sm" />
              <div className="flex-1 flex gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={commentInputRef}
                    value={commentBody}
                    onChange={handleCommentChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && mentionQuery === null) { e.preventDefault(); handleAddComment() }
                      if (e.key === 'Escape') setMentionQuery(null)
                    }}
                    placeholder="Add a comment... (type @ to mention)"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-[#F4622A]"
                  />
                  {mentionQuery !== null && (
                    <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 max-h-48 overflow-y-auto">
                      {membersLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading users...</div>
                      ) : mentionUsers.length > 0 ? mentionUsers.map((user) => (
                        <button
                          key={user.id}
                          onMouseDown={(e) => { e.preventDefault(); handleSelectMention(user) }}
                          className="w-full text-left px-3 py-2 hover:bg-orange-50 flex items-center gap-2 transition-colors"
                        >
                          <Avatar name={user.name} size="xs" />
                          <span className="text-sm text-gray-800">{user.name}</span>
                        </button>
                      )) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">No users found</div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAddComment}
                  disabled={addComment.isPending || !commentBody.trim()}
                  className="p-2 rounded-xl bg-[#F4622A] text-white hover:bg-[#E05520] transition disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Assignees */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Assignees</h3>
            {task.assignees.length === 0 ? (
              <p className="text-sm text-gray-400">No assignees</p>
            ) : (
              <div className="space-y-2">
                {task.assignees.map((assignee) => (
                  <div key={assignee.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={assignee.name} size="sm" />
                      <span className="text-sm font-medium text-gray-800">{assignee.name}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${assignee.role === 'Primary' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {assignee.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Task Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created By</span>
                <span className="font-medium text-gray-800">{task.createdByName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created At</span>
                <span className="font-medium text-gray-800">{formatDate(task.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Due Date</span>
                <span className="font-medium text-gray-800">{formatDate(task.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Priority</span>
                <TaskPriorityBadge priority={task.priority} />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
