interface TaskTableSkeletonProps {
  rows?: number
  includeCreatedBy?: boolean
}

export function TaskTableSkeleton({ rows = 8, includeCreatedBy = true }: TaskTableSkeletonProps) {
  const headers = includeCreatedBy
    ? ['S.No', 'Project', 'Task Name', 'Assigned User', 'Due Date', 'Created By', 'Status', 'Priority', 'Actions']
    : ['S.No', 'Project', 'Task Name', 'Assigned User', 'Due Date', 'Status', 'Priority', 'Actions']

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="sticky top-0 z-10 bg-white border-b border-gray-50">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-4 py-3">
                <div className="h-3 w-5 bg-gray-200 rounded" />
              </td>
              <td className="px-4 py-3">
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </td>
              <td className="px-4 py-3">
                <div className="h-3 w-36 bg-gray-200 rounded" />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <div className="h-6 w-6 bg-gray-200 rounded-full" />
                  <div className="h-6 w-6 bg-gray-200 rounded-full" />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </td>
              {includeCreatedBy && (
                <td className="px-4 py-3">
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </td>
              )}
              <td className="px-4 py-3">
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
              </td>
              <td className="px-4 py-3">
                <div className="h-5 w-14 bg-gray-200 rounded-full" />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-6 w-6 bg-gray-200 rounded-lg" />
                  <div className="h-6 w-6 bg-gray-200 rounded-lg" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
