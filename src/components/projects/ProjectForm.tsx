import { useEffect, useRef, useState } from 'react'
import { X, ChevronDown, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { ErrorMessage } from '../common/ErrorMessage'
import { Spinner } from '../ui/spinner'
import { Modal } from '../ui/modal'
import { UploadedImage } from '../common/UploadedImage'
import { useCreateProject, useUpdateProject } from '../../lib/queries/projects.queries'
import { useUploadDownloadUrl } from '../../lib/queries/uploads.queries'
import { useOrgs, useOrgMembers } from '../../lib/queries/orgs.queries'
import { getPresignedUrl, uploadToPresignedUrl } from '../../lib/api/uploads.api'
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_ERROR_MESSAGE } from '../../constants/uploads'
import { isDirectUrl, isUploadKey, normalizeUploadKey } from '../../utils/uploads'
import type { Project } from '../../types/project.types'

interface ProjectFormProps {
  initial?: Partial<Project>
  onSuccess: () => void
  onCancel: () => void
}

export function ProjectForm({ initial, onSuccess, onCancel }: ProjectFormProps) {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [orgId, setOrgId] = useState(initial?.orgId ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'active')
  const [logoKey, setLogoKey] = useState<string | undefined>(initial?.logo)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | undefined>(undefined)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isLogoZoomOpen, setIsLogoZoomOpen] = useState(false)
  const [logoZoom, setLogoZoom] = useState(1)
  const [isSavingLogoZoom, setIsSavingLogoZoom] = useState(false)
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>(
    initial?.members?.map((m) => m.userId) ?? []
  )
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [error, setError] = useState('')

  const create = useCreateProject()
  const update = useUpdateProject()
  const { data: orgs } = useOrgs()
  const { data: orgMembers } = useOrgMembers(orgId)

  const availableMembers = (orgMembers ?? []).map((m) => ({ id: m.userId, name: m.name, email: m.email }))
  const normalizedLogoKey = normalizeUploadKey(logoKey)
  const logoDownloadKey = isUploadKey(normalizedLogoKey) ? normalizedLogoKey : undefined
  const { data: logoDownloadUrl, isLoading: logoDownloadLoading } = useUploadDownloadUrl(logoDownloadKey)
  const directLogoUrl = isDirectUrl(logoKey) ? logoKey?.trim() : undefined
  const zoomSrc = logoPreviewUrl ?? directLogoUrl ?? logoDownloadUrl

  useEffect(() => {
    if (!logoPreviewUrl) return
    return () => URL.revokeObjectURL(logoPreviewUrl)
  }, [logoPreviewUrl])

  const toggleMember = (userId: string) => {
    setAssignedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleOrgChange = (newOrgId: string) => {
    setOrgId(newOrgId)
    setAssignedUserIds([])
  }

  const handleLogoPick = () => {
    logoInputRef.current?.click()
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.type && !file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setError(MAX_UPLOAD_SIZE_ERROR_MESSAGE)
      return
    }

    const previousKey = logoKey
    const previewUrl = URL.createObjectURL(file)
    setLogoPreviewUrl(previewUrl)
    setError('')
    setIsUploadingLogo(true)

    try {
      const contentType = file.type || 'application/octet-stream'
      const { presignedUrl, key } = await getPresignedUrl({
        folder: 'logos',
        fileName: file.name,
        contentType,
        fileSize: file.size,
      })
      await uploadToPresignedUrl(presignedUrl, file, contentType)
      setLogoKey(key)
      if (initial?.id) {
        await update.mutateAsync({ id: initial.id, data: { logo: key } })
      }
    } catch (err: any) {
      setLogoPreviewUrl(undefined)
      setLogoKey(previousKey)
      setError(err?.message ?? 'Failed to upload logo.')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Project title is required.'); return }
    if (isUploadingLogo || isSavingLogoZoom) { setError('Logo upload in progress. Please wait.'); return }
    try {
      if (initial?.id) {
        const payload: Partial<Project> = { title: title.trim(), description: description.trim(), orgId: orgId || undefined, status, logo: logoKey }
        await update.mutateAsync({ id: initial.id, data: payload })
      } else {
        await create.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          logo: logoKey,
          orgId: orgId || undefined,
          status,
          assignedUserIds: assignedUserIds.length ? assignedUserIds : undefined,
        } as any)
      }
      onSuccess()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save project.')
    }
  }

  const isPending = create.isPending || update.isPending || isUploadingLogo || isSavingLogoZoom
  const selectedMemberNames = availableMembers.filter((m) => assignedUserIds.includes(m.id)).map((m) => m.name)
  const logoValue = logoPreviewUrl ?? logoKey
  const logoFallback = (
    <div className="text-center">
      <div className="text-2xl">+</div>
      <div className="text-xs">{logoValue ? 'Change Logo' : 'Add Logo'}</div>
    </div>
  )

  const handleSaveLogoZoom = async () => {
    if (!zoomSrc) return
    setError('')
    setIsSavingLogoZoom(true)

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('Unable to load logo for saving. Please re-upload the image and try again.'))
        image.src = zoomSrc
      })

      const size = 512
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to initialize image editor.')

      // White background so padded areas look consistent across the app.
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)

      const iw = img.naturalWidth || img.width
      const ih = img.naturalHeight || img.height
      if (!iw || !ih) throw new Error('Invalid logo image.')

      const containScale = Math.min(size / iw, size / ih)
      const scale = containScale * logoZoom
      const dw = iw * scale
      const dh = ih * scale
      const dx = (size - dw) / 2
      const dy = (size - dh) / 2

      ctx.drawImage(img, dx, dy, dw, dh)

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Unable to save this logo. Please re-upload the image and try again.'))), 'image/png')
      })

      if (blob.size > MAX_UPLOAD_SIZE_BYTES) throw new Error(MAX_UPLOAD_SIZE_ERROR_MESSAGE)

      const fileName = `logo-${Date.now()}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      const { presignedUrl, key } = await getPresignedUrl({
        folder: 'logos',
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      })
      await uploadToPresignedUrl(presignedUrl, file, file.type)

      setLogoPreviewUrl(URL.createObjectURL(file))
      setLogoKey(key)
      if (initial?.id) {
        await update.mutateAsync({ id: initial.id, data: { logo: key } })
      }

      setIsLogoZoomOpen(false)
      setLogoZoom(1)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save logo.')
    } finally {
      setIsSavingLogoZoom(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorMessage message={error} />}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <button
            type="button"
            onClick={handleLogoPick}
            disabled={isPending}
            className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#F4622A] hover:text-[#F4622A] transition relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {logoValue ? (
              <UploadedImage value={logoValue} alt="Project logo" fallback={logoFallback} />
            ) : (
              logoFallback
            )}
            {isUploadingLogo && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Spinner size="sm" />
              </div>
            )}
          </button>

          {logoValue && (
            <button
              type="button"
              onClick={() => { setLogoZoom(1); setIsLogoZoomOpen(true) }}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-[#F4622A] hover:border-orange-200 transition"
              title="Zoom"
              aria-label="Zoom logo"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          )}

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>
      </div>

      <Modal
        isOpen={isLogoZoomOpen}
        onClose={() => { setIsLogoZoomOpen(false); setLogoZoom(1) }}
        title="Logo Preview"
        size="xl"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLogoZoom((z) => Math.max(0.5, z - 0.25))}
              disabled={logoZoom <= 0.5}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={logoZoom}
              onChange={(e) => setLogoZoom(Number(e.target.value))}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setLogoZoom((z) => Math.min(3, z + 0.25))}
              disabled={logoZoom >= 3}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLogoZoom(1)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Reset
            </button>
            <span className="text-xs text-gray-500 w-12 text-right">{Math.round(logoZoom * 100)}%</span>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            {zoomSrc ? (
              <div className="mx-auto w-full max-w-[520px] aspect-square rounded-xl bg-white border border-gray-100 overflow-hidden flex items-center justify-center">
                <img
                  src={zoomSrc}
                  alt="Project logo preview"
                  className="w-full h-full object-contain transition-transform"
                  style={{ transform: `scale(${logoZoom})` }}
                />
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-500">
                <Spinner size="md" />
                <p className="text-sm">{logoDownloadLoading ? 'Loading logo...' : 'No logo to preview.'}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsLogoZoomOpen(false); setLogoZoom(1) }}
              disabled={isSavingLogoZoom}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveLogoZoom}
              loading={isSavingLogoZoom}
              disabled={!zoomSrc}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
      <Input label="Project Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter Project Title" required />
      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter Project Description" />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Organization</label>
        <select
          value={orgId}
          onChange={(e) => handleOrgChange(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-[#F4622A] focus:outline-none focus:ring-2 focus:ring-[#F4622A]/20"
        >
          <option value="">Select Organization (optional)</option>
          {(orgs ?? []).map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      {/* Member selection - only shown on create and when an org is selected */}
      {!initial?.id && orgId && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Assign Members</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMemberDropdown((v) => !v)}
              className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 transition focus:border-[#F4622A] focus:outline-none focus:ring-2 focus:ring-[#F4622A]/20"
            >
              <span className={selectedMemberNames.length ? 'text-gray-900 truncate' : 'text-gray-400'}>
                {selectedMemberNames.length ? selectedMemberNames.join(', ') : 'Select members...'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1" />
            </button>
            {showMemberDropdown && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-36 overflow-y-auto">
                {availableMembers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-400">No members in this organization</div>
                ) : (
                  availableMembers.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignedUserIds.includes(m.id)}
                        onChange={() => toggleMember(m.id)}
                        className="rounded border-gray-300 text-[#F4622A] focus:ring-[#F4622A] flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{m.name}</div>
                        <div className="text-xs text-gray-400 truncate">{m.email}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
          {assignedUserIds.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {availableMembers.filter((m) => assignedUserIds.includes(m.id)).map((m) => (
                <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
                  {m.name}
                  <button type="button" onClick={() => toggleMember(m.id)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Project['status'])}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-[#F4622A] focus:outline-none focus:ring-2 focus:ring-[#F4622A]/20"
        >
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="sticky bottom-0 -mx-5 -mb-4 px-5 pb-4 pt-3 bg-white border-t border-gray-100 flex justify-end gap-3 mt-4 z-10">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isPending}>{initial?.id ? 'Update Project' : 'Create Project'}</Button>
      </div>
    </form>
  )
}
