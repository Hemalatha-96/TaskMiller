import { cn } from '../../utils/cn'

interface AvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const COLORS = [
  'bg-orange-400', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-red-500',
]

function getColor(name: string) {
  const idx = name.charCodeAt(0) % COLORS.length
  return COLORS[idx]
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }
  if (src) {
    return <img src={src} alt={name} className={cn('rounded-full object-cover', sizes[size], className)} />
  }
  return (
    <span className={cn('rounded-full inline-flex items-center justify-center font-semibold text-white flex-shrink-0', getColor(name), sizes[size], className)}>
      {getInitials(name)}
    </span>
  )
}

export function AvatarGroup({ names, max = 4, size = 'sm' }: { names: string[]; max?: number; size?: 'xs' | 'sm' | 'md' }) {
  const visible = names.slice(0, max)
  const rest = names.length - max
  return (
    <div className="flex -space-x-2">
      {visible.map((name) => (
        <Avatar key={name} name={name} size={size} className="ring-2 ring-white" />
      ))}
      {rest > 0 && (
        <span className={cn('rounded-full inline-flex items-center justify-center bg-gray-200 text-gray-600 font-semibold ring-2 ring-white text-xs', size === 'xs' ? 'w-6 h-6' : 'w-8 h-8')}>
          +{rest}
        </span>
      )}
    </div>
  )
}
