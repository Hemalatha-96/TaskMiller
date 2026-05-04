import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useCreateUserMutation } from '../../queries/users.queries'
import { useAuth } from '../../hooks/useAuth'
import type { ApiError } from '../../types/api.types'

interface UserFormProps {
  onClose: () => void
}

export default function UserForm({ onClose }: UserFormProps) {
  const { isSuperAdmin } = useAuth()
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [role,     setRole]     = useState<'admin' | 'developer'>('developer')
  const [showPass, setShowPass] = useState(false)

  const { mutate: createUser, isPending, error } = useCreateUserMutation()

  const apiError     = error as ApiError | null
  const errorMessage = apiError?.message ?? null
  const fieldErrors  = apiError?.errors?.reduce<Record<string, string>>(
    (acc, e) => ({ ...acc, [e.field]: e.message }),
    {},
  ) ?? {}

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    createUser({ name, email, password, role }, { onSuccess: onClose })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 pb-6">

        <div className="flex items-center pt-6 pb-4 border-b border-gray-100 mb-2">
          <h2 className="text-base font-semibold text-gray-800">Create User</h2>
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors ${fieldErrors.name ? 'border-red-400' : 'border-gray-200'}`}
            />
            {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@company.com"
              required
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors ${fieldErrors.email ? 'border-red-400' : 'border-gray-200'}`}
            />
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-orange-400 transition-colors ${fieldErrors.password ? 'border-red-400' : 'border-gray-200'}`}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
          </div>

          {/* Role — superadmin can pick, admin always creates as developer */}
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="flex gap-3">
                {(['admin', 'developer'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                      role === r
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
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
              {isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>

        </form>
    </div>
  )
}
