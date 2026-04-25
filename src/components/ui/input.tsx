import { cn } from '../../utils/cn'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
}

export function Input({ label, error, leftIcon, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {leftIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</span>}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#F4622A] focus:outline-none focus:ring-2 focus:ring-[#F4622A]/20 disabled:bg-gray-50 disabled:text-gray-500',
            leftIcon && 'pl-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
