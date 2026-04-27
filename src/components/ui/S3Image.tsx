import React from 'react'
import { useDownloadUrl } from '../../queries/uploads.queries'
import { UserRound } from 'lucide-react'

interface S3ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storageKey:        string
  fallbackInitials?: string
}

export default function S3Image({ storageKey, fallbackInitials, className = '', alt = 'image', ...props }: S3ImageProps) {
  const { data, isLoading, isError } = useDownloadUrl(storageKey)

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <UserRound className="w-3.5 h-3.5 text-white/70" />
      </div>
    )
  }

  if (isError || !data?.url) {
    return (
      <div className={`flex items-center justify-center font-bold ${className}`}>
        {fallbackInitials ?? '?'}
      </div>
    )
  }

  return (
    <img
      src={data.url}
      alt={alt}
      className={`object-cover ${className}`}
      {...props}
    />
  )
}
