import React, { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useRequestOtpMutation, useVerifyOtpMutation } from '../../queries/auth.queries'
import type { ApiError } from '../../types/api.types'

type Step = 'request' | 'verify'

export default function OtpForm() {
  const navigate = useNavigate()

  const [step, setStep]   = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [otp, setOtp]     = useState('')
  const [info, setInfo]   = useState('')

  const {
    mutate: requestOtp,
    isPending: isRequesting,
    error: requestError,
  } = useRequestOtpMutation()

  const {
    mutate: verifyOtp,
    isPending: isVerifying,
    error: verifyError,
  } = useVerifyOtpMutation()

  const handleRequestOtp = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    requestOtp(email, {
      onSuccess: (result) => {
        setInfo(result.message)
        setStep('verify')
      },
    })
  }

  const handleVerifyOtp = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    verifyOtp(
      { email, otp },
      { onSuccess: () => navigate({ to: '/dashboard', search: {} as any }) },
    )
  }

  const requestErrorMsg = (requestError as ApiError | null)?.message ?? null
  const verifyErrorMsg  = (verifyError as ApiError | null)?.message ?? null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-sm p-8">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-gray-800 text-lg">Task Miller</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'request' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
            {step === 'verify' ? '✓' : '1'}
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'verify' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
            2
          </div>
        </div>

        {step === 'request' ? (
          <>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Sign in with OTP</h1>
            <p className="text-sm text-gray-500 mb-6">Enter your email to receive a 6-digit code</p>

            {requestErrorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg mb-4">
                {requestErrorMsg}
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isRequesting}
                className="w-full bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRequesting ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Enter OTP</h1>
            {info && <p className="text-sm text-green-600 mb-4">{info}</p>}
            <p className="text-sm text-gray-500 mb-6">
              Code sent to <span className="font-medium text-gray-700">{email}</span>
            </p>

            {verifyErrorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg mb-4">
                {verifyErrorMsg}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6-digit Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 transition-colors tracking-[0.5em] text-center font-mono text-lg"
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying || otp.length !== 6}
                className="w-full bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isVerifying ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('request'); setOtp('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
              >
                ← Change email
              </button>
            </form>
          </>
        )}

        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-orange-500 font-medium hover:underline">
            Sign in with password instead
          </Link>
        </div>

      </div>
    </div>
  )
}
