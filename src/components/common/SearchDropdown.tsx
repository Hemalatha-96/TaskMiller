import { useRef, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface SuggestionItem {
  id: string
  label: string
  subtitle?: string
}

interface SearchDropdownProps {
  value: string
  onChange: (value: string) => void
  onSelect: (item: SuggestionItem) => void
  suggestions: SuggestionItem[]
  placeholder?: string
  className?: string
}

export function SearchDropdown({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder = 'Search...',
  className,
}: SearchDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showDropdown = open && value.trim().length > 0 && suggestions.length > 0

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={cn(
            'pl-8 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#F4622A] focus:ring-1 focus:ring-[#F4622A]/20',
            className,
          )}
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[260px] bg-white rounded-lg border border-gray-200 shadow-lg z-50 overflow-hidden">
          {suggestions.map((item) => (
            <button
              key={item.id}
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(item)
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2.5 hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-b-0"
            >
              <p className="text-sm font-medium text-gray-800 truncate">{item.label}</p>
              {item.subtitle && (
                <p className="text-xs text-gray-400 truncate mt-0.5">{item.subtitle}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
