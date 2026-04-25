import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Mail } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useRequestOtp, useVerifyOtp } from '../../lib/queries/auth.queries'

export function OtpForm() {
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const requestOtp = useRequestOtp()
  const verifyOtp = useVerifyOtp()

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      const res = await requestOtp.mutateAsync(email)
      setMessage(res.message)
      setStep('verify')
    } catch (err: any) {
      setError(err.message ?? 'Failed to send OTP')
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await verifyOtp.mutateAsync({ email, otp })
      navigate({ href: '/dashboard' })
    } catch (err: any) {
      setError(err.message ?? 'OTP verification failed')
    }
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{message}</div>}
        <p className="text-sm text-gray-500">Enter the OTP sent to <strong>{email}</strong></p>
        <Input label="OTP Code" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} required />
        <Button type="submit" className="w-full" loading={verifyOtp.isPending} size="lg">Verify OTP</Button>
        <button type="button" onClick={() => setStep('request')} className="w-full text-sm text-gray-500 hover:text-gray-700">Back</button>
      </form>
    )
  }

  return (
    <form onSubmit={handleRequest} className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
      <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" leftIcon={<Mail className="w-4 h-4" />} required />
      <Button type="submit" className="w-full" loading={requestOtp.isPending} size="lg">Send OTP</Button>
      <p className="text-center text-sm text-gray-500">
        Remember your password?{' '}
        <Link to="/login" search={{}} className="text-[#F4622A] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
