import { Eye, Trash2 } from 'lucide-react'
import { Avatar } from '../ui/avatar'
import { formatDate } from '../../utils/date'
import { cn } from '../../utils/cn'
import type { ProjectMember } from '../../types/project.types'

const ROLE_COLORS: Record<string, string> = {
  manager: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  user: 'bg-gray-100 text-gray-600',
}

interface ProjectMembersPanelProps {
  members: ProjectMember[]
  onView?: (member: ProjectMember) => void
  onRemove?: (userId: string) => void
}

export function ProjectMembersPanel({ members, onView, onRemove }: ProjectMembersPanelProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">S.No</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created On</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tasks Assigned</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {members.map((member, i) => (
            <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 text-gray-500 text-xs">{String(i + 1).padStart(2, '0')}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={member.name} size="sm" />
                  <span className="font-medium text-gray-800 text-sm">{member.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-500 text-sm">{formatDate(member.joinedAt)}</td>
              <td className="px-4 py-3 text-gray-700 text-sm font-medium">{member.tasksAssigned}</td>
              <td className="px-4 py-3">
                <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', ROLE_COLORS[member.role] ?? ROLE_COLORS.user)}>
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {onView && (
                    <button onClick={() => onView(member)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition" title="View Member">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onRemove && (
                    <button onClick={() => onRemove(member.userId)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition" title="Remove Member">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
