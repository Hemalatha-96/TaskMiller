import React, { useState } from 'react'
import { useCreateOrgMutation } from '../../queries/orgs.queries'
import { toSlug } from '../../lib/utils'
import type { ApiError } from '../../types/api.types'

interface OrgFormProps {
  onClose: () => void
}

export default function OrgForm({ onClose }: OrgFormProps) {
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')

  const { mutate: createOrg, isPending, error } = useCreateOrgMutation()

  const apiError    = error as ApiError | null
  const errorMessage = apiError?.message ?? null

  const slug = toSlug(name)

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    createOrg(
      { name, slug, description: description.trim() || undefined },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 pb-6">

        <div className="flex items-center pt-6 pb-4 border-b border-gray-100 mb-2">
          <h2 className="text-base font-semibold text-gray-800">Create Organization</h2>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg mb-4">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors"
            />
            {slug && (
              <p className="text-xs text-gray-400 mt-1">
                Slug: <span className="text-gray-600 font-medium">{slug}</span>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this organization do?"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors resize-none"
            />
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
              className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>

    </div>
  )
}
