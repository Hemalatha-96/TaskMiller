import { useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { isDirectUrl, isUploadKey, normalizeUploadKey } from '../../utils/uploads'
import { useUploadDownloadUrl } from '../../lib/queries/uploads.queries'

type UploadedImageProps = {
  value?: string
  alt: string
  className?: string
  fallback?: ReactNode
}

export function UploadedImage({ value, alt, className, fallback }: UploadedImageProps) {
  const [errored, setErrored] = useState(false)
  const directSrc = isDirectUrl(value) ? value?.trim() : undefined
  const key = !directSrc && isUploadKey(value) ? normalizeUploadKey(value) : undefined
  const { data: downloadSrc, isError } = useUploadDownloadUrl(key)

  const src = directSrc ?? downloadSrc

  if (!src || errored || isError) return <>{fallback}</>

  return (
    <img
      src={src}
      alt={alt}
      className={cn('w-full h-full object-cover', className)}
      onError={() => setErrored(true)}
    />
  )
}

