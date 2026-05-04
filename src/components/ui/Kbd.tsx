import React from 'react'

interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

export function Kbd({ className = '', children, ...props }: KbdProps) {
  return (
    <kbd
      className={`pointer-events-none inline-flex h-5 select-none items-center rounded border border-gray-200 bg-white px-1.5 font-mono text-[10px] font-semibold text-gray-400 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </kbd>
  )
}
