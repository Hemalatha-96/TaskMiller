import { useNavigate } from '@tanstack/react-router'
import { Building2, ArrowRight, Calendar } from 'lucide-react'
import type { Organization } from '../../types/org.types'
import { userColor, formatDate } from '../../lib/utils'

interface OrgTableProps {
  orgs: Organization[]
}

export default function OrgTable({ orgs }: OrgTableProps) {
  const navigate = useNavigate()

  if (orgs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
          <Building2 size={22} className="text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">No organizations found</p>
        <p className="text-xs text-gray-400">Create your first organization to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
      {orgs.map((org) => {
        const color = userColor(org.id)
        return (
          <div
            key={org.id}
            onClick={() => navigate({ to: '/organizations/$orgId', params: { orgId: org.slug } })}
            className="group relative bg-white border border-gray-100 rounded-xl p-4 hover:border-orange-200 hover:shadow-md cursor-pointer transition-all"
          >
            {/* Arrow */}
            <ArrowRight
              size={13}
              className="absolute top-3.5 right-3.5 text-gray-300 group-hover:text-orange-400 transition-colors"
            />

            {/* Avatar */}
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <span className="text-white font-bold text-sm">{org.name.charAt(0)}</span>
            </div>

            {/* Name + Slug */}
            <p className="font-semibold text-gray-800 text-sm leading-snug">{org.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">/{org.slug}</p>

            {/* Date */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 border-t border-gray-50 pt-2.5">
              <Calendar size={11} />
              <span>{formatDate(org.createdAt)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
