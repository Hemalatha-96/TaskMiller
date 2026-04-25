import { useQuery } from '@tanstack/react-query'
import { KEYS } from '../../constants/queryKeys'
import { getDownloadUrl } from '../api/uploads.api'

function normalizeKey(value: string): string {
  return value.trim().replace(/^\/+/, '')
}

export function useUploadDownloadUrl(key?: string) {
  const normalized = typeof key === 'string' && key.trim() ? normalizeKey(key) : undefined

  return useQuery({
    queryKey: KEYS.UPLOAD_DOWNLOAD_URL(normalized ?? ''),
    queryFn: async () => {
      const res = await getDownloadUrl(normalized!)
      return res.url
    },
    enabled: !!normalized,
    staleTime: 1000 * 60 * 50,
  })
}

