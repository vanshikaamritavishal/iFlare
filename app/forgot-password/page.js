'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Radar, ArrowRight, ArrowLeft, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { resolveUniversity } from '@/lib/universities'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: enter email, 2: OTP + new password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Countdown ticker for the Resend button.
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const sendResetCode = async () => {
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address')
      return
    }
    // Same domain gate as signup — we only serve university emails.
    const uni = resolveUniversity(trimmed)
    if (!uni.valid) {
      setError(uni.reason || 'Please use your university email.')
      return
    }

    setIsLoading(true)
    setError('')
    setInfo('')
    try {
      const res = await fetch('/api/auth/forgot-password/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Could not send reset code')
        return
      }
      setInfo(`If ${trimmed} has an iFLARE account, we've sent a 6-digit reset code.`)
      setOtp('')
      setNewPassword('')
      setResendCooldown(60)
      setStep(2)
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyAndReset = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit code from your email')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Reset failed')
        return
      }
      // Success — bounce back to /login with a small hint via query
      router.push('/login?reset=1')
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return
    await sendResetCode()
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => {
            if (step === 1) router.push('/login')
            else setStep(1)
          }}
          className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Radar className="w-6 h-6 text-orange-500" />
          <h1 className="text-lg font-bold">iFLARE</h1>
        </div>
        <div className="w-10" />
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-orange-500' : 'bg-slate-700'}`} />
        <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-orange-500' : 'bg-slate-700'}`} />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}
      {info && !error && (
        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-300 text-sm">
          {info}
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold mb-2">Reset your password</h2>
          <p className="text-slate-400 mb-6">
            Enter your iFLARE college email and we&apos;ll send you a 6-digit code to set a new password.
          </p>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">College Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="you@sst.scaler.com"
                className="h-14 pl-12 bg-slate-800/50 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="mt-auto">
            <Button
              onClick={sendResetCode}
              disabled={!email.trim() || isLoading}
              className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending code...
                </span>
              ) : (
                <>
                  Send reset code
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold mb-2">Enter your code</h2>
          <p className="text-slate-400 mb-6">
            We sent a 6-digit code to <span className="text-orange-400">{email.trim().toLowerCase()}</span>. It expires in 10 minutes.
          </p>

          <div className="mb-4">
            <label className="text-sm text-slate-400 mb-2 block">Verification code</label>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setError('')
                setInfo('')
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }}
              placeholder="123456"
              className="h-14 text-center text-2xl tracking-[0.5em] bg-slate-800/50 border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">New password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                placeholder="Choose a new password"
                className="h-14 pl-12 pr-12 bg-slate-800/50 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">At least 6 characters.</p>
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isLoading}
            className="mt-4 text-sm text-orange-400 hover:text-orange-300 disabled:text-slate-600 disabled:cursor-not-allowed self-start"
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
          </button>

          <div className="mt-auto">
            <Button
              onClick={verifyAndReset}
              disabled={otp.length !== 6 || newPassword.length < 6 || isLoading}
              className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating password...
                </span>
              ) : (
                <>
                  Update password
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
