import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}

function getPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const range: (number | '…')[] = [1]
  const left = Math.max(2, current - 1)
  const right = Math.min(total - 1, current + 1)
  if (left > 2) range.push('…')
  for (let i = left; i <= right; i++) range.push(i)
  if (right < total - 1) range.push('…')
  range.push(total)
  return range
}

export function Pagination({ page, totalPages, total, pageSize, onChange }: PaginationProps) {
  if (total === 0) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const pages = getPageRange(page, totalPages)

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
      <span>Showing {start}–{end} of {total} entries</span>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {pages.map((n, i) =>
            n === '…' ? (
              <span key={`e-${i}`} className="w-7 h-7 flex items-center justify-center text-gray-400 text-xs select-none">…</span>
            ) : (
              <button
                key={n}
                onClick={() => onChange(n as number)}
                className={cn(
                  'w-7 h-7 rounded-lg text-xs font-medium transition',
                  n === page ? 'bg-[#F4622A] text-white' : 'hover:bg-gray-100 text-gray-600',
                )}
              >
                {n}
              </button>
            )
          )}

          <button
            onClick={() => onChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
