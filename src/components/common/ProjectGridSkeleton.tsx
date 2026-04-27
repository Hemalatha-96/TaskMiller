interface ProjectGridSkeletonProps {
  count?: number
}

export function ProjectGridSkeleton({ count = 8 }: ProjectGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-200 rounded-lg flex-shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="h-3.5 w-28 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-3/4 bg-gray-200 rounded" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex -space-x-1">
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-6 w-6 bg-gray-200 rounded-full ring-2 ring-white" />
              ))}
            </div>
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
