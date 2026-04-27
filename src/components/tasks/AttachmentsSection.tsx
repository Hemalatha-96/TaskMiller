import { useState, useRef } from 'react'
import { Upload, Loader2, Trash2, Download, Eye, MoreVertical } from 'lucide-react'
import {
  useAttachments,
  useAddAttachmentMutation,
  useDeleteAttachmentMutation
} from '../../queries/attachments.queries'
import { useUploadFile } from '../../queries/uploads.queries'
import { getAttachmentDownloadUrlApi } from '../../http/services/attachments.service'
import { useAuth } from '../../hooks/useAuth'
import Pagination from '../ui/Pagination'
import type { Attachment } from '../../types/task.types'

interface AttachmentsSectionProps {
  taskId: string
}

function formatBytes(bytes: number) {
  if (!+bytes) return '0 B'
  const k    = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i    = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(0))} ${sizes[i]}`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function fileTypeLabel(mimeType: string, fileName: string): { label: string; color: string } {
  const ext = fileName.split('.').pop()?.toUpperCase() ?? ''
  if (mimeType === 'application/pdf')                                              return { label: 'PDF',  color: 'bg-red-100 text-red-600' }
  if (mimeType.startsWith('image/'))                                               return { label: ext || 'IMG', color: 'bg-purple-100 text-purple-600' }
  if (mimeType.includes('word') || ext === 'DOC' || ext === 'DOCX')               return { label: 'DOC',  color: 'bg-blue-100 text-blue-600' }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || ext === 'XLSX' || ext === 'XLS') return { label: 'XLS', color: 'bg-green-100 text-green-600' }
  if (mimeType.includes('presentation') || ext === 'PPT' || ext === 'PPTX')       return { label: 'PPT',  color: 'bg-orange-100 text-orange-600' }
  if (mimeType.includes('zip') || mimeType.includes('compressed') || ext === 'ZIP' || ext === 'RAR') return { label: ext || 'ZIP', color: 'bg-yellow-100 text-yellow-700' }
  if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('html'))      return { label: ext || 'CODE', color: 'bg-gray-200 text-gray-700' }
  if (mimeType.startsWith('video/'))                                               return { label: ext || 'VID', color: 'bg-pink-100 text-pink-600' }
  if (mimeType.startsWith('audio/'))                                               return { label: ext || 'AUD', color: 'bg-indigo-100 text-indigo-600' }
  if (mimeType.startsWith('text/'))                                                return { label: 'TXT',  color: 'bg-gray-100 text-gray-600' }
  return { label: ext || 'FILE', color: 'bg-gray-100 text-gray-500' }
}

function isViewable(mimeType: string) {
  return mimeType.startsWith('image/') || mimeType === 'application/pdf'
}

// ─── Attachment Card ──────────────────────────────────────────────────────────

function AttachmentCard({ attachment, taskId, canDelete }: { attachment: Attachment; taskId: string; canDelete: boolean }) {
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isViewing,     setIsViewing]     = useState(false)

  const { mutate: deleteAttachment, isPending: isDeleting } = useDeleteAttachmentMutation(taskId)

  const handleDownload = async () => {
    setMenuOpen(false)
    try {
      setIsDownloading(true)
      const { url } = await getAttachmentDownloadUrlApi(taskId, attachment.id)
      const res = await fetch(url)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = attachment.fileName
      a.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      alert('Failed to download attachment.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleView = async () => {
    setMenuOpen(false)
    try {
      setIsViewing(true)
      const { url } = await getAttachmentDownloadUrlApi(taskId, attachment.id)
      window.open(url, '_blank')
    } catch {
      alert('Failed to open attachment.')
    } finally {
      setIsViewing(false)
    }
  }

  const handleDelete = () => {
    setMenuOpen(false)
    if (confirm('Are you sure you want to delete this attachment?')) {
      deleteAttachment(attachment.id)
    }
  }

  const isBusy = isDownloading || isViewing || isDeleting

  return (
    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 transition-colors">

      {/* File type badge */}
      {(() => {
        const { label, color } = fileTypeLabel(attachment.mimeType, attachment.fileName)
        return (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-[10px] tracking-wide ${color}`}>
            {label}
          </div>
        )
      })()}

      {/* Name + time */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate leading-tight" title={attachment.fileName}>
          {attachment.fileName}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(attachment.createdAt)}</p>
      </div>

      {/* Size badge */}
      <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded-md px-2 py-0.5 font-medium flex-shrink-0">
        {formatBytes(attachment.fileSize)}
      </span>

      {/* 3-dot menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          disabled={isBusy}
          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {isBusy ? <Loader2 size={16} className="animate-spin" /> : <MoreVertical size={16} />}
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-36 py-1">
              {isViewable(attachment.mimeType) && (
                <button
                  onClick={handleView}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye size={14} className="text-gray-400" />
                  View
                </button>
              )}
              <button
                onClick={handleDownload}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download size={14} className="text-gray-400" />
                Download
              </button>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── AttachmentsSection ───────────────────────────────────────────────────────

export default function AttachmentsSection({ taskId }: AttachmentsSectionProps) {
  const { user, isAdmin } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(6)

  const { data, isLoading } = useAttachments(taskId)
  const attachments = data?.attachments ?? []

  const { mutateAsync: uploadFile, isPending: isUploadingToS3 } = useUploadFile()
  const { mutate: addAttachment, isPending: isAddingToDb } = useAddAttachmentMutation(taskId)

  const isUploading = isUploadingToS3 || isAddingToDb

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB')
      return
    }
    setUploadError(null)

    try {
      const key = await uploadFile({ folder: 'attachments', file })
      addAttachment({
        s3Key:    key,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
      })
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload attachment')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="mt-6 flex flex-col h-full overflow-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700">Attachments</h3>
          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">
            {attachments.length}
          </span>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 text-sm font-semibold bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {uploadError && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg font-medium">
            {uploadError}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          </div>
        ) : attachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <Upload size={22} className="mb-2 opacity-40" />
            <p className="text-sm">No attachments yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(() => {
              const start = (page - 1) * limit
              const paged = attachments.slice(start, start + limit)
              return paged.map((attachment) => (
                <AttachmentCard
                  key={attachment.id}
                  attachment={attachment}
                  taskId={taskId}
                  canDelete={isAdmin || user?.id === attachment.uploader.id}
                />
              ))
            })()}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {!isLoading && attachments.length > 0 && (
        <Pagination
          page={page}
          totalPages={Math.ceil(attachments.length / limit)}
          totalRecords={attachments.length}
          startEntry={(page - 1) * limit + 1}
          endEntry={Math.min(page * limit, attachments.length)}
          limit={limit}
          hasPrevPage={page > 1}
          hasNextPage={page < Math.ceil(attachments.length / limit)}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1) }}
          className="flex-shrink-0 flex items-center justify-between py-3 bg-white border-t border-gray-100"
        />
      )}
    </div>
  )
}
