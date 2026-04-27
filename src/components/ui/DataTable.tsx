import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { RowData } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'center' | 'right'
    className?: string
    headerClassName?: string
  }
}

interface DataTableProps<TData> {
  columns:          ColumnDef<TData, any>[]
  data:             TData[]
  sorting?:         SortingState
  onSortingChange?: OnChangeFn<SortingState>
  emptyMessage?:    string
}

export default function DataTable<TData>({
  columns,
  data,
  sorting        = [],
  onSortingChange,
  emptyMessage   = 'No records found.',
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    state:         { sorting },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  })

  if (data.length === 0) {
    return <div className="py-16 text-center text-sm text-gray-400">{emptyMessage}</div>
  }

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-20">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="table-header text-xs text-gray-600 font-semibold">
            {headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort()
              const sorted  = header.column.getIsSorted()
              return (
                <th
                  key={header.id}
                  className={`px-5 py-3 text-left whitespace-nowrap select-none bg-[#ccfbf1] ${header.column.columnDef.meta?.headerClassName || ''}`}
                  onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  style={{ cursor: canSort ? 'pointer' : 'default' }}
                >
                  <div className={`flex items-center gap-1 ${header.column.columnDef.meta?.align === 'center' ? 'justify-center' : ''}`}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {canSort && (
                      sorted === 'asc'  ? <ChevronUp   size={12} className="text-gray-700" /> :
                      sorted === 'desc' ? <ChevronDown size={12} className="text-gray-700" /> :
                                         <ChevronsUpDown size={12} className="text-gray-400" />
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        ))}
      </thead>
      <tbody className="divide-y divide-gray-50">
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="hover:bg-gray-50 transition-colors">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className={`px-5 py-3 ${cell.column.columnDef.meta?.className || ''} ${cell.column.columnDef.meta?.align === 'center' ? 'text-center' : ''}`}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
