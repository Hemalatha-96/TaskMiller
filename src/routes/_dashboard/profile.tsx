import React, { useState, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Mail, ShieldCheck, Phone, Building2, Clock, Camera, Loader2, Pencil, X,
} from 'lucide-react'
import { useMe, useUpdateMeMutation } from '../../queries/users.queries'
import { useUploadFile } from '../../queries/uploads.queries'
import S3Image from '../../components/ui/S3Image'
import ImageCropperModal from '../../components/ui/ImageCropperModal'
import { ProfileSkeleton } from '../../components/ui/Skeleton'
import { formatDate, roleBadgeClasses, userColor } from '../../lib/utils'
import type { ApiError } from '../../types/api.types'

export const Route = createFileRoute('/_dashboard/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: profile, isLoading } = useMe()

  const [editOpen,   setEditOpen]   = useState(false)
  const [name,       setName]       = useState('')
  const [phone,      setPhone]      = useState('')
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null)
  const [selectedFileForCrop, setSelectedFileForCrop] = useState<{ file: File; dataUrl: string } | null>(null)

  const avatarInputRef = useRef<HTMLInputElement>(null)

  const { mutate: updateMe, isPending: isUpdating, error } = useUpdateMeMutation()
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile()

  const apiError     = error as ApiError | null
  const errorMessage = apiError?.message ?? null
  const fieldErrors  = apiError?.errors?.reduce<Record<string, string>>(
    (acc, e) => ({ ...acc, [e.field]: e.message }),
    {},
  ) ?? {}

  const handleOpenEdit = () => {
    if (!profile) return
    setName(profile.name)
    setPhone(profile.phone ?? '')
    setEditOpen(true)
  }

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateMe(
      { name: name.trim(), phone: phone.trim() || undefined },
      { onSuccess: () => setEditOpen(false) },
    )
  }

  // Avatar-only update
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setAvatarUploadError('File size must be less than 10MB'); return }
    setAvatarUploadError(null)
    const reader = new FileReader()
    reader.onload = () => setSelectedFileForCrop({ file, dataUrl: reader.result as string })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropComplete = async (croppedFile: File) => {
    setSelectedFileForCrop(null)
    try {
      const key = await uploadFile({ folder: 'avatars', file: croppedFile })
      updateMe({ avatarUrl: key })
    } catch {
      setAvatarUploadError('Failed to upload image. Please try again.')
    }
  }

  if (isLoading || !profile) {
    return <ProfileSkeleton />
  }

  return (
    <div className="flex-1 overflow-y-auto pb-6">
    <div className="max-w-2xl mx-auto w-full space-y-5">

      {/* ── Profile details card ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">

        {/* Header row: avatar + name/role + edit icon */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-4">

            {/* Avatar with camera button */}
            <div className="relative group flex-shrink-0">
              <div className={`w-14 h-14 rounded-full ${userColor(profile.id)} flex items-center justify-center overflow-hidden`}>
                {profile.avatarUrl ? (
                  <S3Image storageKey={profile.avatarUrl} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-xl">{profile.name.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Camera overlay — avatar-only update */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 rounded-full bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                title="Change profile photo"
              >
                {isUploading
                  ? <Loader2 size={16} className="text-white animate-spin" />
                  : <Camera size={16} className="text-white" />
                }
              </button>

              <input
                type="file"
                ref={avatarInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarFileChange}
              />
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-800 leading-tight">{profile.name}</h2>
              <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${roleBadgeClasses[profile.role] ?? 'bg-gray-100 text-gray-600'}`}>
                {profile.role}
              </span>
            </div>
          </div>

          {/* Edit icon */}
          <button
            onClick={editOpen ? () => setEditOpen(false) : handleOpenEdit}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex-shrink-0"
            title={editOpen ? 'Close' : 'Edit profile'}
          >
            {editOpen ? <X size={15} /> : <Pencil size={15} />}
          </button>
        </div>

        {avatarUploadError && (
          <p className="text-xs text-red-500 mt-3">{avatarUploadError}</p>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-5">

          <div className="flex items-start gap-2.5">
            <Mail size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-700 break-all">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldCheck size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Role</p>
              <p className="text-sm font-medium text-gray-700 capitalize">{profile.role}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Phone size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-700">{profile.phone ?? '—'}</p>
            </div>
          </div>

          {profile.orgName && (
            <div className="flex items-start gap-2.5">
              <Building2 size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Organization</p>
                <p className="text-sm font-medium text-gray-700">{profile.orgName}</p>
              </div>
            </div>
          )}

          {profile.lastLoginAt && (
            <div className="flex items-start gap-2.5">
              <Clock size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Last Login</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(profile.lastLoginAt)}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2.5">
            <Clock size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Member Since</p>
              <p className="text-sm font-medium text-gray-700">{formatDate(profile.createdAt)}</p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Edit form — shown only when edit icon is clicked ──────────────── */}
      {editOpen && (
        <div className="bg-white rounded-xl border border-gray-100 px-6 pb-6">

          <div className="pt-5 pb-4 border-b border-gray-100 mb-5">
            <h3 className="text-base font-semibold text-gray-800">Update Profile</h3>
          </div>

          {errorMessage && Object.keys(fieldErrors).length === 0 && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg mb-4">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors ${fieldErrors.name ? 'border-red-400' : 'border-gray-200'}`}
              />
              {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors ${fieldErrors.phone ? 'border-red-400' : 'border-gray-200'}`}
              />
              {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </form>
        </div>
      )}

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
    </div>
  )
}
