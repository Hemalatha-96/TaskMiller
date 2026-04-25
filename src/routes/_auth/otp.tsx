import { createFileRoute } from '@tanstack/react-router'
import { OtpForm } from '../../components/auth/OtpForm'

export const Route = createFileRoute('/_auth/otp')({
  component: OtpPage,
})

function OtpPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Login with OTP</h1>
      <p className="text-sm text-gray-500 mb-6">Enter your email to receive a one-time password</p>
      <OtpForm />
    </div>
  )
}
