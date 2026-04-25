import { cn } from '../../utils/cn'
import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        id={inputId}
        className={cn(
          'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#F4622A] focus:outline-none focus:ring-2 focus:ring-[#F4622A]/20 disabled:bg-gray-50 resize-none',
          error && 'border-red-500',
          className,
        )}
        rows={4}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
