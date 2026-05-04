import { useState } from 'react'
import { Search, UserPlus, ShieldCheck, Code2 } from 'lucide-react'
import { useUnassignedUsers, useAssignAdminMutation, useAddDeveloperMutation } from '../../queries/orgs.queries'
import { avatarColors , getInitials} from '../../lib/utils'
import type { ApiError } from '../../types/api.types'

interface AddMemberModalProps {
  mode:    'admin' | 'developer'
  orgId:   string
  onClose: () => void
}

export default function AddMemberModal({ mode, orgId, onClose }: AddMemberModalProps) {
  const [search,     setSearch]     = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const role = mode === 'admin' ? 'admin' : 'developer'
  const { data, isLoading } = useUnassignedUsers(role)
  const allUsers = data?.users ?? []

  const filtered = allUsers.filter((u) =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const { mutate: assignAdmin, isPending: isAssigning, error: assignError } = useAssignAdminMutation()
  const { mutate: addDeveloper, isPending: isAdding,   error: addError     } = useAddDeveloperMutation()

  const isPending = isAssigning || isAdding
  const error     = (assignError ?? addError) as ApiError | null

  const handleSubmit = () => {
    if (!selectedId) return
    if (mode === 'admin') {
      assignAdmin({ orgId, userId: selectedId }, { onSuccess: onClose })
    } else {
      addDeveloper({ orgId, userId: selectedId }, { onSuccess: onClose })
    }
  }

  const title    = mode === 'admin' ? 'Assign Admin' : 'Add Developer'
  const Icon     = mode === 'admin' ? ShieldCheck    : Code2
  const iconCls  = mode === 'admin' ? 'text-blue-500' : 'text-green-500'
  const iconBg   = mode === 'admin' ? 'bg-blue-100'   : 'bg-green-100'
  const btnColor = mode === 'admin'
    ? 'bg-blue-500 hover:bg-blue-600'
    : 'bg-green-600 hover:bg-green-700'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
          <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={14} className={iconCls} />
          </div>
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="bg-transparent outline-none flex-1 text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Error */}
        {error?.message && (
          <div className="mx-5 mb-1 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
            {error.message}
          </div>
        )}

        {/* User list */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <UserPlus size={22} className="mb-2 text-gray-300" />
              <p className="text-sm">No unassigned {role}s found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((user, i) => {
                const isSelected = selectedId === user.id
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : user.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left ${
                      isSelected
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-xs font-semibold">{getInitials(user.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedId || isPending}
            className={`flex-1 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btnColor}`}
          >
            {isPending ? 'Saving...' : title}
          </button>
        </div>

    </div>
  )
}
