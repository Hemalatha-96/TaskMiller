import { useMutation, useQuery } from '@tanstack/react-query'
import { getPresignedUrlApi, getDownloadUrlApi, uploadToS3 } from '../http/services/uploads.service'
import { authStore } from '../store/auth.store'
import { useStore } from '@tanstack/react-store'

export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ folder, file }: { folder: string; file: File }) => {
      // 1. Get the presigned URL
      const { presignedUrl, key } = await getPresignedUrlApi(folder, file.name, file.type, file.size)
      
      // 2. Upload file directly to S3
      await uploadToS3(presignedUrl, file)
      
      // 3. Return the persistent key
      return key
    },
  })
}

export function useDownloadUrl(key: string | undefined | null) {
  const accessToken = useStore(authStore, (s) => s.accessToken)
  return useQuery({
    queryKey: ['download-url', key],
    queryFn: () => getDownloadUrlApi(key!),
    enabled: !!key && !!accessToken,
    staleTime: 55 * 60 * 1000,
  })
}
