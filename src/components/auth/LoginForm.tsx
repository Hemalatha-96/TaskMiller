import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useLogin, useRequestOtp, useVerifyOtp } from '../../lib/queries/auth.queries'

type LoginMode = 'password' | 'otp'
type OtpStep = 'request' | 'verify'

type LoginFormProps = {
  redirectTo?: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [mode, setMode] = useState<LoginMode>('password')

  // Password login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // OTP login state
  const [otpEmail, setOtpEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpStep, setOtpStep] = useState<OtpStep>('request')
  const [otpMessage, setOtpMessage] = useState('')

  const [error, setError] = useState('')
  const navigate = useNavigate()
  const login = useLogin()
  const requestOtp = useRequestOtp()
  const verifyOtp = useVerifyOtp()

  const navigateAfterAuth = () => {
    const safeRedirect =
      redirectTo &&
      redirectTo.startsWith('/') &&
      !redirectTo.startsWith('/login') &&
      !redirectTo.startsWith('/register') &&
      !redirectTo.startsWith('/otp')
        ? redirectTo
        : null

    if (safeRedirect) {
      navigate({ href: safeRedirect, replace: true })
      return
    }

    navigate({ href: '/dashboard', replace: true })
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
  setError('')
    try {
      await login.mutateAsync({ email, password })
      navigateAfterAuth()
    } catch (err: any) {
      setError(err.message ?? 'Login failed')
    }
  }

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setOtpMessage('')
    try {
      const res = await requestOtp.mutateAsync(otpEmail)
      setOtpMessage(res.message)
      setOtpStep('verify')
    } catch (err: any) {
      setError(err.message ?? 'Failed to send OTP')
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await verifyOtp.mutateAsync({ email: otpEmail, otp })
      navigateAfterAuth()
    } catch (err: any) {
      setError(err.message ?? 'OTP verification failed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
        <button
          type="button"
          onClick={() => { setMode('password'); setError('') }}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'password' ? 'bg-white text-[#F4622A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => { setMode('otp'); setError(''); setOtpStep('request'); setOtpMessage('') }}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'otp' ? 'bg-white text-[#F4622A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          OTP Login
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Password Login */}
      {mode === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 py-2 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#F4622A] focus:outline-none focus:ring-2 focus:ring-[#F4622A]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-[#F4622A]" />
              Remember me
            </label>
          </div>
          <Button type="submit" className="w-full" loading={login.isPending} size="lg">
            Sign In
          </Button>
          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#F4622A] font-medium hover:underline">Sign up</Link>
          </p>
           <div className="mt-4 rounded-lg bg-orange-50 border border-orange-200 p-3 text-xs text-orange-700 space-y-1">
            {/* <p className="font-semibold">Demo credentials:</p>
            <p>Super Admin: superadmin@taskmiller.com / SuperAdmin@123</p>
            <p>Admin: maheshbabubaddipudi@gmail.com /admin123</p>
            <p>Developer: dev1@company.com /password123</p> */}
          </div> 
        </form>
      )}

      {/* OTP Login */}
      {mode === 'otp' && (
        <>
          {otpStep === 'request' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                placeholder="Enter your email"
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
              <Button type="submit" className="w-full" loading={requestOtp.isPending} size="lg">
                Send OTP
              </Button>
              <p className="text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#F4622A] font-medium hover:underline">Sign up</Link>
              </p>
            </form>
          )}

          {otpStep === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {otpMessage && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{otpMessage}</div>
              )}
              <p className="text-sm text-gray-500">
                OTP sent to <strong>{otpEmail}</strong>
              </p>
              <Input
                label="OTP Code"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
              />
              <Button type="submit" className="w-full" loading={verifyOtp.isPending} size="lg">
                Verify OTP
              </Button>
              <button
                type="button"
                onClick={() => { setOtpStep('request'); setOtp(''); setOtpMessage(''); setError('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Back
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )
}
