const LIMIT_OPTIONS = [5, 10, 20, 50, 100]

interface PaginationProps {
  page:         number
  totalPages:   number
  totalRecords: number
  startEntry:   number
  endEntry:     number
  limit:        number
  hasPrevPage:  boolean | undefined
  hasNextPage:  boolean | undefined
  onPageChange: (page: number) => void
  onLimitChange:(limit: number) => void
  className?:   string
}

export default function Pagination({
  page, totalPages, totalRecords,
  startEntry, endEntry, limit,
  hasPrevPage, hasNextPage,
  onPageChange, onLimitChange,
  className,
}: PaginationProps) {
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  )

  return (
    <div className={className ?? 'flex-shrink-0 flex items-center justify-between -mx-6 px-11 py-3 bg-white border-t border-gray-100'}>

      {/* Left — entries info + rows selector */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-500">
          Showing{' '}
          <span className="font-medium text-gray-700">{startEntry}–{endEntry}</span>
          {' '}of{' '}
          <span className="font-medium text-gray-700">{totalRecords}</span>
          {' '}entries
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Rows:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-600 bg-gray-50 outline-none cursor-pointer"
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Right — page buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={!hasPrevPage}
          className="px-2.5 py-1 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {pageNumbers.map((p, i) => {
          const prev = pageNumbers[i - 1]
          return (
            <span key={p} className="flex items-center gap-1">
              {prev && p - prev > 1 && (
                <span className="text-xs text-gray-400 px-1">…</span>
              )}
              <button
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  p === page ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            </span>
          )
        })}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={!hasNextPage}
          className="px-2.5 py-1 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>

    </div>
  )
}
