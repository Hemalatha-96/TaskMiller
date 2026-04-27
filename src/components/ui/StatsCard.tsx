import type { ReactNode } from 'react'

interface StatsCardProps {
  label: string
  value: number | string
  iconBg: string
  icon: ReactNode
}

export default function StatsCard({ label, value, iconBg, icon }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-4 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-400 font-medium mt-1 leading-tight">{label}</p>
      </div>
    </div>
  )
}
