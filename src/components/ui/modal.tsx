import { useEffect } from 'react'
import { cn } from '../../utils/cn'
import { X } from 'lucide-react'

let openModalCount = 0
let previousBodyOverflow: string | null = null

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return

    if (openModalCount === 0) {
      previousBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    openModalCount += 1

    return () => {
      openModalCount = Math.max(0, openModalCount - 1)
      if (openModalCount === 0) {
        document.body.style.overflow = previousBodyOverflow ?? ''
        previousBodyOverflow = null
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-2xl w-full mx-4 max-h-[90vh] flex flex-col', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
