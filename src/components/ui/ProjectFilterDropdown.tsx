import { useState, useRef } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import type { Project } from '../../types/project.types'

interface Props {
  value:     string
  onChange:  (val: string) => void
  projects:  Project[]
}

export default function ProjectFilterDropdown({ value, onChange, projects }: Props) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)

  const selected = projects.find((p) => p.id === value)
  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  )

  const close = () => { setOpen(false); setSearch('') }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 border border-gray-200 rounded-lg pl-3 pr-2 py-1.5 text-xs text-gray-500 bg-gray-50 outline-none cursor-pointer hover:border-gray-300 transition-colors"
      >
        <span className={selected ? 'text-gray-700 font-medium' : ''}>
          {selected ? selected.title : 'All Projects'}
        </span>
        {selected ? (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); close() }}
            className="p-0.5 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={11} className="text-gray-400" />
          </span>
        ) : (
          <ChevronDown size={12} className="text-gray-400" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[9]" onClick={close} />
          <div className="absolute top-full mt-1 left-0 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg z-[10]">
            <div className="p-2 border-b border-gray-100 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 flex-1">
                <Search size={11} className="text-gray-400 flex-shrink-0" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects..."
                  className="bg-transparent outline-none flex-1 text-xs text-gray-700 placeholder-gray-400 w-full"
                />
              </div>
              <button
                type="button"
                onClick={close}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X size={13} />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <button
                type="button"
                onClick={() => { onChange(''); close() }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-orange-50 transition-colors ${!value ? 'font-semibold text-orange-500' : 'text-gray-600'}`}
              >
                All Projects
              </button>
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">No projects found</p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { onChange(p.id); close() }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-orange-50 transition-colors truncate ${value === p.id ? 'font-semibold text-orange-500' : 'text-gray-700'}`}
                  >
                    {p.title}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
