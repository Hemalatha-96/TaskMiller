import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '../../components/auth/LoginForm'

export const Route = createFileRoute('/_auth/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const { redirect } = Route.useSearch()
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
      <p className="text-sm text-gray-500 mb-6">Sign in to your Task Miller account</p>
      <LoginForm redirectTo={redirect} />
    </div>
  )
}
