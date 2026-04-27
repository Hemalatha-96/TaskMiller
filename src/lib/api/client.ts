import axios from 'axios'
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../../utils/token'
import { useAuthStore } from '../../store/auth.store'

const BASE_URL = import.meta.env.VITE_PUBLIC_API_URL ?? 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only handle 401 errors that haven't been retried yet
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // If another refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearTokens()
      useAuthStore.getState().clearAuth()
      processQueue(error, null)
      isRefreshing = false
      return Promise.reject(error)
    }

    try {
      // Use a plain axios call to avoid interceptor loops
      const res = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken })
      const tokens = res.data?.data?.tokens ?? res.data?.tokens
      const { accessToken, refreshToken: newRefreshToken } = tokens ?? {}

      if (!accessToken) throw new Error('No access token in refresh response')

      saveTokens(accessToken, newRefreshToken ?? refreshToken)

      const { user } = useAuthStore.getState()
      if (user) {
        useAuthStore.getState().setAuth(user, accessToken, newRefreshToken ?? refreshToken)
      }

      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      processQueue(null, accessToken)
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      clearTokens()
      useAuthStore.getState().clearAuth()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
