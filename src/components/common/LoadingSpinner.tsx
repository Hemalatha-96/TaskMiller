import { Spinner } from '../ui/spinner'

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}
