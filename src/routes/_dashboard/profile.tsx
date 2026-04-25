import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { Camera, Loader2, Mail, Phone, Shield, Clock, CalendarDays, CheckCircle2, Circle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useMe, useUpdateMe } from '../../lib/queries/users.queries'
import { useAuthStore } from '../../store/auth.store'
import { Avatar } from '../../components/ui/avatar'
import { UploadedImage } from '../../components/common/UploadedImage'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { getPresignedUrl, uploadToPresignedUrl } from '../../lib/api/uploads.api'
import { formatDate } from '../../utils/date'
import { isDirectUrl } from '../../utils/uploads'

export const Route = createFileRoute('/_dashboard/profile')({
  component: ProfilePage,
})

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-700',
  admin: 'bg-orange-100 text-orange-700',
  manager: 'bg-blue-100 text-blue-700',
  developer: 'bg-teal-100 text-teal-700',
}

function ProfilePage() {
  const { user: authUser } = useAuth()
  const { data: profile, isLoading } = useMe()
  const updateUserStore = useAuthStore((s) => s.updateUser)
  const updateMe = useUpdateMe()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [blobPreview, setBlobPreview] = useState<string | undefined>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '')
      setPhone(profile.phone ?? '')
    }
  }, [profile])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setSuccess('')
    // Show immediate local preview
    const localUrl = URL.createObjectURL(file)
    setBlobPreview(localUrl)
    setAvatarUploading(true)
    try {
      const { presignedUrl, key } = await getPresignedUrl({
        folder: 'avatars',
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      })
      await uploadToPresignedUrl(presignedUrl, file, file.type)
      const updated = await updateMe.mutateAsync({ avatar: key })
      updateUserStore({ avatar: updated.avatar })
      // If API returned a full URL, use it; otherwise keep blob preview until refetch
      if (updated.avatar && isDirectUrl(updated.avatar)) {
        setBlobPreview(updated.avatar)
      }
      setSuccess('Profile picture updated successfully.')
    } catch (err: any) {
      setBlobPreview(undefined)
      setError(err?.message ?? 'Failed to upload avatar.')
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const updated = await updateMe.mutateAsync({ name: name.trim(), phone: phone.trim() || undefined })
      updateUserStore({ name: updated.name })
      setSuccess('Profile updated successfully.')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update profile.')
    }
  }

  const displayName = profile?.name ?? authUser?.name ?? 'User'
  const displayRole = profile?.role ?? authUser?.role ?? ''
  const displayEmail = profile?.email ?? authUser?.email ?? ''
  const isActive = profile?.status === 'active'
  const roleColor = ROLE_COLORS[displayRole] ?? 'bg-gray-100 text-gray-600'
  const savedAvatarKey = profile?.avatar

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-4 pb-8 pt-1">
        <h1 className="text-base font-bold text-gray-900">My Profile</h1>

        {/* Profile card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Cover */}
          <div className="h-16 bg-gradient-to-r from-[#F4622A]/20 via-orange-50 to-orange-100" />

          <div className="px-6 pb-5">
            {/* Avatar row */}
            <div className="flex items-end gap-4 -mt-8 mb-4">
              <div className="relative group flex-shrink-0">
                <div className="ring-4 ring-white rounded-full w-11 h-11 overflow-hidden flex-shrink-0">
                  {blobPreview ? (
                    <img src={blobPreview} alt={displayName} className="w-full h-full object-cover rounded-full" />
                  ) : savedAvatarKey ? (
                    <UploadedImage
                      value={savedAvatarKey}
                      alt={displayName}
                      className="rounded-full"
                      fallback={<Avatar name={displayName} size="lg" />}
                    />
                  ) : (
                    <Avatar name={displayName} size="lg" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                  title="Change profile picture"
                >
                  {avatarUploading
                    ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                    : <Camera className="w-5 h-5 text-white" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <div className="flex-1 min-w-0 mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 truncate">{displayName}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleColor}`}>
                    <Shield className="w-3 h-3" />
                    {displayRole}
                  </span>
                  {profile && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                      {profile.status}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="mt-1 text-xs text-[#F4622A] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {avatarUploading ? 'Uploading…' : 'Edit photo'}
                </button>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Email</div>
                  <div className="text-xs font-medium text-gray-700 truncate">{displayEmail}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Phone</div>
                  <div className="text-xs font-medium text-gray-700">{profile?.phone || '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Member Since</div>
                  <div className="text-xs font-medium text-gray-700">{profile?.createdAt ? formatDate(profile.createdAt) : '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Last Login</div>
                  <div className="text-xs font-medium text-gray-700">{profile?.lastLoginAt ? formatDate(profile.lastLoginAt) : '—'}</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Projects', value: profile?.projects ?? 0 },
                { label: 'Tasks', value: profile?.tasks ?? 0 },
                { label: 'In Progress', value: profile?.inProgress ?? 0 },
                { label: 'Pending', value: profile?.pending ?? 0 },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-gray-800">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">Edit Information</h3>

          {error   && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{error}</div>}
          {success && <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
              <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email Address" type="email" value={displayEmail} disabled />
              <Input label="Role" value={displayRole} disabled />
            </div>
            <div className="flex justify-end pt-1">
              <Button type="submit" loading={updateMe.isPending}>Save Changes</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
