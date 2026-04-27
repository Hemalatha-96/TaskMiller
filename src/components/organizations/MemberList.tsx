import { Users } from 'lucide-react'
import type { OrgMember } from '../../types/org.types'
import { userColor, formatDate } from '../../lib/utils'
import S3Image from '../ui/S3Image'

interface MemberListProps {
  members: OrgMember[]
}

const roleBadge: Record<string, string> = {
  admin:     'bg-blue-50 text-blue-600 border border-blue-100',
  developer: 'bg-green-50 text-green-600 border border-green-100',
}

export default function MemberList({ members }: MemberListProps) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Users size={22} className="text-gray-300 mb-2" />
        <p className="text-xs text-gray-400">No members yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-500 font-semibold">
            <th className="px-4 py-3 text-left w-10">#</th>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Role</th>
            <th className="px-4 py-3 text-left">Joined</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {members.map((m, i) => (
            <tr key={m.memberId} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-400 text-xs">{String(i + 1).padStart(2, '0')}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full ${userColor(m.userId)} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
                    {m.avatarUrl ? (
                      <S3Image storageKey={m.avatarUrl} fallbackInitials={m.name.charAt(0)} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-semibold">{m.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="font-medium text-gray-700 text-sm">{m.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">{m.email}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${roleBadge[m.role] ?? 'bg-gray-100 text-gray-600'}`}>
                  {m.role}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(m.joinedAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={`text-xs font-medium ${m.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                    {m.status}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
