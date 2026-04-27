import React, { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useLoginMutation } from '../../queries/auth.queries'
import type { ApiError } from '../../types/api.types'

const TEST_CREDENTIALS = [
  { role: 'Super Admin', email: 'superadmin@taskmiller.com', password: 'SuperAdmin@123' },
  { role: 'Admin',       email: 'maheshbabubaddipudi@gmail.com', password: 'admin123' },
  { role: 'Developer',   email: 'dev1@company.com', password: 'password123' },
]

export default function LoginForm() {
  const navigate = useNavigate()
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)

  const fillCredentials = (cred: typeof TEST_CREDENTIALS[number]) => {
    setEmail(cred.email)
    setPassword(cred.password)
  }

  const { mutate: login, isPending, error } = useLoginMutation()

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    login(
      { email, password },
      { onSuccess: () => navigate({ to: '/dashboard', search: {} as any }) },
    )
  }

  const apiError = error as ApiError | null
  const errorMessage = apiError?.message ?? null
  const fieldErrors: Record<string, string> = {}
  if (Array.isArray(apiError?.errors)) {
    for (const e of apiError.errors) {
      if (e.field) fieldErrors[e.field] = e.message
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF7F4] flex overflow-hidden">
      
      {/* ── Left Section: Branding & Illustration ── */}
      <div className="hidden lg:flex flex-1 flex-col p-12 h-screen">
        {/* Logo */}
        <div className="flex-shrink-0 z-10">
          <span className="font-extrabold text-[#FF6B00] text-4xl tracking-tight">Task Miller</span>
        </div>

        {/* Big Graphic */}
        <div className="flex-1 w-full mt-8 flex items-end justify-center pointer-events-none min-h-0">
        </div>
      </div>

      {/* ── Right Section: Form Card ── */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="bg-white w-full max-w-[440px] rounded-[2rem] shadow-2xl shadow-orange-900/5 p-8 sm:p-10 border border-white">
          
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

        {/* Test credentials */}
        <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2.5 mb-6">
          <p className="text-xs font-semibold text-orange-600 mb-2">Quick fill — test accounts</p>
          <div className="flex gap-2 flex-wrap">
            {TEST_CREDENTIALS.map((cred) => (
              <button
                key={cred.role}
                type="button"
                onClick={() => fillCredentials(cred)}
                className="text-xs bg-white border border-orange-200 text-orange-600 font-medium px-2.5 py-1 rounded-md hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors"
              >
                {cred.role}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && Object.keys(fieldErrors).length === 0 && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg mb-4">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors ${fieldErrors.email ? 'border-red-400' : 'border-gray-200'}`}
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-orange-400 transition-colors ${fieldErrors.password ? 'border-red-400' : 'border-gray-200'}`}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPass ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/otp" className="text-sm text-orange-500 font-medium hover:underline">
            Sign in with OTP instead
          </Link>
        </div>

        </div>
      </div>
    </div>
  )
}
