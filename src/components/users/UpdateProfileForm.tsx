import React, { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { useUpdateMeMutation } from '../../queries/users.queries'
import { useUploadFile } from '../../queries/uploads.queries'
import type { UserDetail } from '../../types/user.types'
import { getInitials } from '../../lib/utils'
import S3Image from '../ui/S3Image'
import ImageCropperModal from '../ui/ImageCropperModal'
import type { ApiError } from '../../types/api.types'

interface UpdateProfileFormProps {
  profile: UserDetail
  onClose: () => void
}

export default function UpdateProfileForm({ profile, onClose }: UpdateProfileFormProps) {
  const [name,  setName]  = useState(profile.name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  // Cropper state
  const [selectedFileForCrop, setSelectedFileForCrop] = useState<{ file: File; dataUrl: string } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutate: updateMe, isPending: isUpdating, error } = useUpdateMeMutation()
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile()
  const isPending = isUpdating || isUploading

  const apiError     = error as ApiError | null
  const errorMessage = apiError?.message ?? null
  const fieldErrors  = apiError?.errors?.reduce<Record<string, string>>(
    (acc, e) => ({ ...acc, [e.field]: e.message }),
    {},
  ) ?? {}

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateMe(
      { name: name.trim(), phone: phone.trim() || undefined, avatarUrl: avatarUrl || undefined },
      { onSuccess: onClose },
    )
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB')
      return
    }
    setUploadError(null)

    // Read the file as a data URL for the cropper preview
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedFileForCrop({ file, dataUrl: reader.result as string })
    }
    reader.readAsDataURL(file)
    
    // Clear the input so selecting the same file again triggers change event
    e.target.value = ''
  }

  const handleCroppedSave = async (croppedFile: File) => {
    setSelectedFileForCrop(null)
    setUploadError(null)
    
    try {
      const key = await uploadFile({ folder: 'avatars', file: croppedFile })
      setAvatarUrl(key)
    } catch (err) {
      setUploadError('Failed to upload image. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md px-6 pb-6 shadow-xl max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-white z-10 flex items-center justify-between pt-6 pb-4">
          <h2 className="text-base font-semibold text-gray-800">Update Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {errorMessage && Object.keys(fieldErrors).length === 0 && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg mb-4">
            {errorMessage}
          </div>
        )}

        {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg mb-4">
            {uploadError}
          </div>
        )}

        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-2xl font-bold overflow-hidden border-4 border-white shadow-sm">
              {avatarUrl ? (
                <S3Image storageKey={avatarUrl} className="w-full h-full object-cover" />
              ) : (
                getInitials(profile.name)
              )}
            </div>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            >
              <span className="text-white text-xs font-medium">Change</span>
            </button>
            
            {isUploading && (
              <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF (Max. 10MB)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
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

          {/* Phone */}
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

          {/* Read-only info */}
          <div className="bg-gray-50 rounded-lg px-3 py-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Email</span>
              <span className="text-gray-600 font-medium">{profile.email}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Role</span>
              <span className="text-gray-600 font-medium capitalize">{profile.role}</span>
            </div>
          </div>

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
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>

      {selectedFileForCrop && (
        <ImageCropperModal
          imageSrc={selectedFileForCrop.dataUrl}
          fileName={selectedFileForCrop.file.name}
          fileType={selectedFileForCrop.file.type}
          onCancel={() => setSelectedFileForCrop(null)}
          onSave={handleCroppedSave}
        />
      )}
    </div>
  )
}
