import React, { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react'
import {
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from '../../queries/auth.queries'
import { authStore } from '../../store/auth.store'
import { dashboardByRole } from '../../lib/utils'
import type { ApiError } from '../../types/api.types'

const TEST_CREDENTIALS = [
  { role: 'Super Admin', email: 'superadmin@taskmiller.com', password: 'SuperAdmin@123' },
  { role: 'Admin',       email: 'maheshbabubaddipudi@gmail.com', password: 'admin321' },
  { role: 'Developer',   email: 'dev1@company.com', password: 'password321' },
]

type View = 'login' | 'forgot-step1' | 'forgot-step2' | 'forgot-success'

export default function LoginForm() {
  const navigate = useNavigate()
  const [view, setView] = useState<View>('login')

  // Login state
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Forgot password state
  const [fpEmail,        setFpEmail]        = useState('')
  const [fpOtp,          setFpOtp]          = useState('')
  const [fpNewPass,      setFpNewPass]      = useState('')
  const [fpConfirmPass,  setFpConfirmPass]  = useState('')
  const [fpShowNew,      setFpShowNew]      = useState(false)
  const [fpShowConfirm,  setFpShowConfirm]  = useState(false)
  const [fpConfirmError, setFpConfirmError] = useState<string | null>(null)
  const [resendSent,     setResendSent]     = useState(false)

  const fillCredentials = (cred: typeof TEST_CREDENTIALS[number]) => {
    setEmail(cred.email)
    setPassword(cred.password)
  }

  const { mutate: login, isPending, error } = useLoginMutation()
  const {
    mutate: forgotPassword,
    isPending: isSendingCode,
    error: fp1Error,
    reset: resetFp1,
  } = useForgotPasswordMutation()
  const {
    mutate: resetPassword,
    isPending: isResetting,
    error: fp2Error,
    reset: resetFp2,
  } = useResetPasswordMutation()

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    login(
      { email, password },
      { onSuccess: () => navigate({ to: dashboardByRole(authStore.state.user?.role) as any, search: {} as any }) },
    )
  }

  const handleForgotStep1 = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setResendSent(false)
    forgotPassword(fpEmail, { onSuccess: () => setView('forgot-step2') })
  }

  const handleResend = () => {
    setResendSent(false)
    resetFp2()
    forgotPassword(fpEmail, { onSuccess: () => setResendSent(true) })
  }

  const handleForgotStep2 = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (fpNewPass !== fpConfirmPass) {
      setFpConfirmError("Passwords don't match")
      return
    }
    setFpConfirmError(null)
    resetPassword(
      { email: fpEmail, otp: fpOtp, newPassword: fpNewPass },
      { onSuccess: () => setView('forgot-success') },
    )
  }

  const handleBackToLogin = () => {
    setView('login')
    setFpEmail('')
    setFpOtp('')
    setFpNewPass('')
    setFpConfirmPass('')
    setFpConfirmError(null)
    setResendSent(false)
    resetFp1()
    resetFp2()
  }

  const apiError = error as ApiError | null
  const errorMessage = apiError?.message ?? null
  const fieldErrors: Record<string, string> = {}
  if (Array.isArray(apiError?.errors)) {
    for (const e of apiError.errors) {
      if (e.field) fieldErrors[e.field] = e.message
    }
  }

  const step1ErrorMsg = (fp1Error as ApiError | null)?.message ?? null
  const step2ErrorMsg = (fp2Error as ApiError | null)?.message ?? null

  return (
    <div className="min-h-screen bg-[#FFF7F4] flex overflow-hidden">

      {/* ── Left Section: Branding & Illustration ── */}
      <div className="hidden lg:flex flex-1 flex-col p-12 h-screen">
        <div className="flex-shrink-0 z-10">
          <span className="font-extrabold text-[#FF6B00] text-4xl tracking-tight">Task Miller</span>
        </div>
        <div className="flex-1 w-full mt-8 flex items-end justify-center pointer-events-none min-h-0">
          <img
            src="/login-left-img.png"
            alt="Professional Task Management"
            className="w-full h-full max-w-4xl object-contain object-bottom mix-blend-multiply"
          />
        </div>
      </div>

      {/* ── Right Section: Form Card ── */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="bg-white w-full max-w-[440px] rounded-[2rem] shadow-2xl shadow-orange-900/5 p-8 sm:p-10 border border-white">

          {/* Card Illustration */}
          <div className="flex justify-center mb-8">
            <img src="/login-form-img.png" alt="Email Security" className="h-32 object-contain" />
          </div>

          {/* ── LOGIN VIEW ─────────────────────────────────────────────── */}
          {view === 'login' && (
            <>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome back</h1>
              <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

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
                  {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={() => { setFpEmail(email); setView('forgot-step1') }}
                      className="text-xs text-orange-500 hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
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
                  {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
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
            </>
          )}

          {/* ── FORGOT PASSWORD STEP 1: Enter email ────────────────────── */}
          {view === 'forgot-step1' && (
            <>
              <button
                onClick={handleBackToLogin}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
              >
                <ArrowLeft size={15} /> Back to Sign In
              </button>

              <h1 className="text-2xl font-bold text-gray-800 mb-1">Forgot Password?</h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email address and we'll send you a reset code.
              </p>

              {step1ErrorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg mb-4">
                  {step1ErrorMsg}
                </div>
              )}

              <form onSubmit={handleForgotStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={fpEmail}
                    onChange={(e) => setFpEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSendingCode}
                  className="w-full bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSendingCode ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            </>
          )}

          {/* ── FORGOT PASSWORD STEP 2: OTP + new password ─────────────── */}
          {view === 'forgot-step2' && (
            <>
              <button
                onClick={() => { setView('forgot-step1'); resetFp2(); setResendSent(false) }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
              >
                <ArrowLeft size={15} /> Change email
              </button>

              <h1 className="text-2xl font-bold text-gray-800 mb-1">Reset Password</h1>
              <p className="text-sm text-gray-500 mb-6">
                We sent a 6-digit code to{' '}
                <span className="font-semibold text-gray-700">{fpEmail}</span>
              </p>

              {step2ErrorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg mb-4">
                  {step2ErrorMsg}
                </div>
              )}

              {resendSent && (
                <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-3 py-2.5 rounded-lg mb-4">
                  Reset code resent to your email.
                </div>
              )}

              <form onSubmit={handleForgotStep2} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reset Code</label>
                  <input
                    type="text"
                    value={fpOtp}
                    onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="• • • • • •"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors tracking-[0.5em] text-center font-mono text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={fpShowNew ? 'text' : 'password'}
                      value={fpNewPass}
                      onChange={(e) => setFpNewPass(e.target.value)}
                      required
                      placeholder="Enter new password"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-orange-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setFpShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {fpShowNew ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={fpShowConfirm ? 'text' : 'password'}
                      value={fpConfirmPass}
                      onChange={(e) => { setFpConfirmPass(e.target.value); setFpConfirmError(null) }}
                      required
                      placeholder="Re-enter new password"
                      className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-orange-400 transition-colors ${fpConfirmError ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setFpShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {fpShowConfirm ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>
                  {fpConfirmError && <p className="text-red-500 text-xs mt-1">{fpConfirmError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-full bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isResetting ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isSendingCode}
                  className="text-sm text-orange-500 hover:underline font-medium disabled:opacity-50"
                >
                  {isSendingCode ? 'Sending...' : "Didn't receive the code? Resend"}
                </button>
              </div>
            </>
          )}

          {/* ── FORGOT PASSWORD SUCCESS ─────────────────────────────────── */}
          {view === 'forgot-success' && (
            <div className="text-center py-4">
              <div className="flex justify-center mb-5">
                <CheckCircle2 size={60} className="text-green-500" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Password Reset!</h1>
              <p className="text-sm text-gray-500 mb-8">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={handleBackToLogin}
                className="w-full bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
