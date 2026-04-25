export function normalizeUploadKey(value?: string): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.replace(/^\/+/, '')
}

export function isDirectUrl(value?: string): boolean {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  return /^(https?:\/\/|data:|blob:)/i.test(trimmed)
}

export function isUploadKey(value?: string): boolean {
  const normalized = normalizeUploadKey(value)
  if (!normalized) return false
  if (isDirectUrl(normalized)) return false
  return normalized.includes('/')
}

