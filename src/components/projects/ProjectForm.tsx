import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Camera, Loader2, X, Search } from 'lucide-react'
import { useCreateProjectMutation, useUpdateProjectMutation } from '../../queries/projects.queries'
import { useOrgs, useOrg } from '../../queries/orgs.queries'
import { useUploadFile } from '../../queries/uploads.queries'
import { useAuth } from '../../hooks/useAuth'
import { avatarColors , getInitials} from '../../lib/utils'
import S3Image from '../ui/S3Image'
import ImageCropperModal from '../ui/ImageCropperModal'
import type { Project } from '../../types/project.types'
import type { ApiError } from '../../types/api.types'

interface ProjectFormProps {
  onClose:  () => void
  project?: Project        // pass to enter edit mode
}


export default function ProjectForm({ onClose, project }: ProjectFormProps) {
  const isEdit        = !!project
  const { isSuperAdmin, orgId: adminOrgId } = useAuth()

  const [title,           setTitle]           = useState(project?.title       ?? '')
  const [description,     setDescription]     = useState(project?.description ?? '')
  const [logoUrl,         setLogoUrl]         = useState<string | null>(project?.logoUrl ?? null)
  const [orgId,           setOrgId]           = useState(project?.orgId ?? (!isSuperAdmin ? (adminOrgId ?? '') : ''))
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    project?.members.map((m) => m.id) ?? [],
  )
  const [orgOpen,      setOrgOpen]      = useState(false)
  const [memberOpen,   setMemberOpen]   = useState(false)
  const [orgSearch,    setOrgSearch]    = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [orgDirection, setOrgDirection] = useState<'down' | 'up'>('down')
  const [memberDirection, setMemberDirection] = useState<'down' | 'up'>('down')

  const orgTriggerRef = useRef<HTMLButtonElement>(null)
  const memberTriggerRef = useRef<HTMLButtonElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFileForCrop, setSelectedFileForCrop] = useState<{ file: File; dataUrl: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: orgsData } = useOrgs({ limit: 100 }, { enabled: isSuperAdmin })
  const { data: orgDetail } = useOrg(orgId)

  const { mutate: createProject, isPending: isCreating, error: createError } = useCreateProjectMutation()
  const { mutate: updateProject, isPending: isUpdating, error: updateError } = useUpdateProjectMutation()
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile()

  const isPending = isCreating || isUpdating || isUploading
  const error     = (createError ?? updateError) as ApiError | null

  const errorMessage = error?.message ?? null
  const fieldErrors  = error?.errors?.reduce<Record<string, string>>(
    (acc, e) => ({ ...acc, [e.field]: e.message }),
    {},
  ) ?? {}

  const orgs    = orgsData?.organizations ?? []
  const members = orgDetail?.members.filter((m) => m.role === 'developer') ?? []

  const selectedOrg = orgs.find((o) => o.id === orgId)

  const filteredOrgs = orgs.filter((o) =>
    o.name.toLowerCase().includes(orgSearch.toLowerCase()),
  )
  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase()),
  )

  const toggleMember = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  useEffect(() => {
    if (orgOpen && orgTriggerRef.current) {
      const rect = orgTriggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setOrgDirection(spaceBelow < 250 ? 'up' : 'down')
    }
  }, [orgOpen])

  useEffect(() => {
    if (memberOpen && memberTriggerRef.current) {
      const rect = memberTriggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setMemberDirection(spaceBelow < 250 ? 'up' : 'down')
    }
  }, [memberOpen])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB')
      return
    }
    setUploadError(null)

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedFileForCrop({ file, dataUrl: reader.result as string })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropComplete = async (croppedFile: File) => {
    try {
      setSelectedFileForCrop(null)
      const key = await uploadFile({ folder: 'logos', file: croppedFile })
      setLogoUrl(key)
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image')
    }
  }

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isEdit) {
      updateProject(
        {
          id: project.id,
          body: {
            title,
            description:     description || undefined,
            logoUrl:         logoUrl || undefined,
            assignedUserIds: selectedUserIds,
          },
        },
        { onSuccess: onClose },
      )
    } else {
      createProject(
        {
          title,
          description:     description || undefined,
          orgId,
          assignedUserIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
          logoUrl:         logoUrl || undefined,
        },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 pb-6">

        <div className="flex items-center pt-6 pb-4 border-b border-gray-100 mb-2">
          <h2 className="text-base font-semibold text-gray-800">
            {isEdit ? 'Edit Project' : 'Create Project'}
          </h2>
        </div>


        {/* Logo Upload Section */}
        <div className="flex flex-col items-center mb-6 mt-2">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed ${uploadError ? 'border-red-400' : 'border-gray-200'} bg-gray-50 transition-colors group-hover:border-orange-400 group-hover:bg-orange-50`}>
              {logoUrl ? (
                <S3Image storageKey={logoUrl} fallbackInitials={title.slice(0, 2).toUpperCase() || 'PR'} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-orange-500 transition-colors">
                  <Camera size={24} className="mb-1" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Logo</span>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                </div>
              )}
            </div>
            
            {/* Remove Logo Button */}
            {logoUrl && !isUploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLogoUrl(null)
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors border-2 border-white z-20"
                title="Remove logo"
              >
                <X size={12} strokeWidth={3} />
              </button>
            )}
            
            {/* Hidden Input */}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {uploadError && <p className="text-xs text-red-500 mt-2 font-medium">{uploadError}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Customer Portal"
              required
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors ${fieldErrors.title ? 'border-red-400' : 'border-gray-200'}`}
            />
            {fieldErrors.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project"
              rows={3}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors resize-none ${fieldErrors.description ? 'border-red-400' : 'border-gray-200'}`}
            />
            {fieldErrors.description && <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>}
          </div>

          {/* Org — create mode, superadmin only */}
          {!isEdit && isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization <span className="text-red-500">*</span></label>
              <div className="relative">
                <button
                  ref={orgTriggerRef}
                  type="button"
                  onClick={() => setOrgOpen((v) => !v)}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between outline-none focus:border-orange-400 transition-colors ${fieldErrors.orgId ? 'border-red-400' : 'border-gray-200'}`}
                >
                  <span className={selectedOrg ? 'text-gray-800' : 'text-gray-400'}>
                    {selectedOrg ? selectedOrg.name : 'Select an organization'}
                  </span>
                  <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
                </button>

                {orgOpen && (
                  <>
                  <div className="fixed inset-0 z-[9]" onClick={() => { setOrgOpen(false); setOrgSearch('') }} />
                  <div className={`absolute ${orgDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-[10]`}>
                    <div className="p-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5">
                        <Search size={12} className="text-gray-400 flex-shrink-0" />
                        <input
                          autoFocus
                          value={orgSearch}
                          onChange={(e) => setOrgSearch(e.target.value)}
                          placeholder="Search organizations..."
                          className="bg-transparent outline-none flex-1 text-xs text-gray-700 placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                      {filteredOrgs.length === 0 ? (
                        <p className="text-sm text-gray-400 px-3 py-3">No organizations found</p>
                      ) : (
                        filteredOrgs.map((org) => (
                          <button
                            key={org.id}
                            type="button"
                            onClick={() => { setOrgId(org.id); setSelectedUserIds([]); setOrgOpen(false); setOrgSearch('') }}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-orange-50 flex items-center justify-between transition-colors"
                          >
                            <span className="text-gray-700">{org.name}</span>
                            {orgId === org.id && <Check size={13} className="text-orange-500" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  </>
                )}
              </div>
              {fieldErrors.orgId && <p className="text-xs text-red-500 mt-1">{fieldErrors.orgId}</p>}
            </div>
          )}

          {/* Members — shown after org is selected */}
          {orgId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Members <span className="text-gray-400 font-normal">(optional)</span>
              </label>

              {/* Selected Member Chips */}
              {selectedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedUserIds.map((id) => {
                    const u = members.find((user) => user.userId === id)
                    if (!u) return null
                    return (
                      <div key={id} className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-full text-xs font-medium">
                        {u.name}
                        <button
                          type="button"
                          onClick={() => toggleMember(id)}
                          className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                        >
                          <X size={12} className="text-orange-600" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="relative">
                <button
                  ref={memberTriggerRef}
                  type="button"
                  onClick={() => setMemberOpen((v) => !v)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between outline-none focus:border-orange-400 transition-colors"
                >
                  <span className="text-gray-400">
                    {selectedUserIds.length === 0
                      ? 'Select members'
                      : 'Add more members...'}
                  </span>
                  <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
                </button>

                {memberOpen && (
                  <>
                  <div className="fixed inset-0 z-[9]" onClick={() => { setMemberOpen(false); setMemberSearch('') }} />
                  <div className={`absolute ${memberDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-[10]`}>
                    <div className="p-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5">
                        <Search size={12} className="text-gray-400 flex-shrink-0" />
                        <input
                          autoFocus
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          placeholder="Search by name or email..."
                          className="bg-transparent outline-none flex-1 text-xs text-gray-700 placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredMembers.filter(m => !selectedUserIds.includes(m.userId)).length === 0 ? (
                        <p className="text-sm text-gray-400 px-3 py-3">No more members to assign</p>
                      ) : (
                        filteredMembers.filter(m => !selectedUserIds.includes(m.userId)).map((m, i) => (
                          <button
                            key={m.userId}
                            type="button"
                            onClick={() => toggleMember(m.userId)}
                            className="w-full text-left px-3 py-2.5 hover:bg-orange-50 flex items-center gap-2.5 transition-colors"
                          >
                            <div className={`w-7 h-7 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center flex-shrink-0`}>
                              <span className="text-white text-xs font-semibold">{getInitials(m.name)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">{m.name}</p>
                              <p className="text-xs text-gray-400 truncate">{m.email}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  </>
                )}
              </div>
            </div>
          )}


          {errorMessage && Object.keys(fieldErrors).length === 0 && (
            <p className="text-xs text-red-500">{errorMessage}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Project')}
            </button>
          </div>

        </form>

        {selectedFileForCrop && (
          <ImageCropperModal
            imageSrc={selectedFileForCrop.dataUrl}
            fileName={selectedFileForCrop.file.name}
            fileType={selectedFileForCrop.file.type}
            onSave={handleCropComplete}
            onCancel={() => setSelectedFileForCrop(null)}
          />
        )}
    </div>
  )
}
