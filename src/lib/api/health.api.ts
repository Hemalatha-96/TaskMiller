import { apiClient } from './client'

export type HealthResponse = unknown

export async function getHealth(): Promise<HealthResponse> {
  const res = await apiClient.get('/health')
  return res.data
}

