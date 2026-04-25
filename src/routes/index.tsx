import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { getAccessToken } from '../utils/token'

export const Route = createFileRoute('/')({
  component: IndexRedirect,
})

function IndexRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    const isAuthenticated = Boolean(getAccessToken())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ to: (isAuthenticated ? '/dashboard' : '/login') as any, replace: true })
  }, [navigate])

  return null
}
