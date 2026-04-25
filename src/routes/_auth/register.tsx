import { createFileRoute } from '@tanstack/react-router'
import { RegisterForm } from '../../components/auth/RegisterForm'

export const Route = createFileRoute('/_auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
      <p className="text-sm text-gray-500 mb-6">Join Task Miller and start managing your projects</p>
      <RegisterForm />
    </div>
  )
}
