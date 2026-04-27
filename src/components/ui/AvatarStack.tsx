import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import S3Image from './S3Image'

interface Avatar {
  id:        string
  name:      string
  email?:    string
  color:     string
  avatarUrl?: string | null
}

interface AvatarStackProps {
  avatars: Avatar[]
  max?:    number
  size?:   'sm' | 'md'
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export default function AvatarStack({ avatars, max = 3, size = 'sm' }: AvatarStackProps) {
  const [open, setOpen]   = useState(false)
  const [pos,  setPos]    = useState({ top: 0, left: 0 })
  const triggerRef        = useRef<HTMLButtonElement>(null)

  const visible  = avatars.slice(0, max)
  const overflow = avatars.length - max
  const dim      = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs'

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX })
    }
    setOpen((v) => !v)
  }

  if (avatars.length === 0) return null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="flex -space-x-2 focus:outline-none"
      >
        {visible.map((a) => (
          <div
            key={a.id}
            title={a.name}
            className={`${dim} ${a.color} rounded-full border-2 border-white flex items-center justify-center font-semibold text-white flex-shrink-0 overflow-hidden relative`}
          >
            {a.avatarUrl ? (
              <S3Image
                storageKey={a.avatarUrl}
                fallbackInitials={initials(a.name)}
                className="w-full h-full object-cover"
              />
            ) : (
              initials(a.name)
            )}
          </div>
        ))}
        {overflow > 0 && (
          <div className={`${dim} bg-orange-100 text-orange-600 rounded-full border-2 border-white flex items-center justify-center font-semibold flex-shrink-0 relative z-10`}>
            +{overflow}
          </div>
        )}
      </button>

      {open && createPortal(
        <div
          style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 min-w-[200px]"
        >
          {avatars.map((a) => (
            <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50">
              <div className={`w-7 h-7 rounded-full ${a.color} flex items-center justify-center flex-shrink-0 overflow-hidden text-[10px] font-semibold text-white`}>
                {a.avatarUrl ? (
                  <S3Image
                    storageKey={a.avatarUrl}
                    fallbackInitials={initials(a.name)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials(a.name)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{a.name}</p>
                {a.email && <p className="text-xs text-gray-400 truncate">{a.email}</p>}
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
