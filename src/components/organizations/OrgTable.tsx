import { useNavigate } from '@tanstack/react-router'
import { Building2, ArrowRight, Calendar } from 'lucide-react'
import type { Organization } from '../../types/org.types'
import { userColor, formatDate , getInitials} from '../../lib/utils'

interface OrgTableProps {
  orgs: Organization[]
  view: 'grid' | 'list'
  startEntry: number
}

export default function OrgTable({ orgs, view, startEntry }: OrgTableProps) {
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

  if (view === 'list') {
    return (
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-gray-200 text-xs text-gray-600 font-semibold uppercase tracking-wide">
            <th className="px-5 py-3 text-left w-10 bg-[#ccfbf1]">S.no</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Organization</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Slug</th>
            <th className="px-5 py-3 text-left bg-[#ccfbf1]">Created</th>
            <th className="px-5 py-3 w-12 bg-[#ccfbf1]" />
          </tr>
        </thead>
        <tbody>
          {orgs.map((org, idx) => {
            const color = userColor(org.id)
            return (
              <tr
                key={org.id}
                onClick={() => navigate({ to: '/organizations/$orgId', params: { orgId: org.slug }, search: { view: 'list' as const, from: undefined } })}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <td className="px-5 py-3 text-gray-400 text-xs">{startEntry + idx}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-xs">{getInitials(org.name)}</span>
                    </div>
                    <p className="font-medium text-gray-800">{org.name}</p>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-gray-400 font-mono">/{org.slug}</td>
                <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(org.createdAt)}</td>
                <td className="px-5 py-3">
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-orange-400 transition-colors ml-auto" />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
      {orgs.map((org) => {
        const color = userColor(org.id)
        return (
          <div
            key={org.id}
            onClick={() => navigate({ to: '/organizations/$orgId', params: { orgId: org.slug }, search: {} as any })}
            className="group relative bg-white border border-gray-100 rounded-xl p-4 hover:border-orange-200 hover:shadow-md cursor-pointer transition-all"
          >
            <ArrowRight size={13} className="absolute top-3.5 right-3.5 text-gray-300 group-hover:text-orange-400 transition-colors" />
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <span className="text-white font-bold text-sm">{getInitials(org.name)}</span>
            </div>
            <p className="font-semibold text-gray-800 text-sm leading-snug">{org.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">/{org.slug}</p>
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
