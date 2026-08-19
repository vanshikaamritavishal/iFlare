'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Radar, ArrowRight, ArrowLeft, Check, Mail, User, Lock, Loader2 } from 'lucide-react'
import { resolveUniversity } from '@/lib/universities'

// Interest categories for building user persona
const INTEREST_CATEGORIES = [
  { id: 'sports', label: '🏃 Sports & Fitness', color: 'bg-green-500/20 border-green-500/50 text-green-400' },
  { id: 'music', label: '🎵 Music & Concerts', color: 'bg-purple-500/20 border-purple-500/50 text-purple-400' },
  { id: 'food', label: '🍕 Food & Dining', color: 'bg-orange-500/20 border-orange-500/50 text-orange-400' },
  { id: 'art', label: '🎨 Art & Culture', color: 'bg-pink-500/20 border-pink-500/50 text-pink-400' },
  { id: 'tech', label: '💻 Tech & Gaming', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400' },
  { id: 'outdoor', label: '🏕️ Outdoor & Adventure', color: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' },
  { id: 'nightlife', label: '🌙 Nightlife & Parties', color: 'bg-violet-500/20 border-violet-500/50 text-violet-400' },
  { id: 'wellness', label: '🧘 Wellness & Mindfulness', color: 'bg-teal-500/20 border-teal-500/50 text-teal-400' },
  { id: 'learning', label: '📚 Learning & Workshops', color: 'bg-amber-500/20 border-amber-500/50 text-amber-400' },
  { id: 'social', label: '☕ Casual Hangouts', color: 'bg-rose-500/20 border-rose-500/50 text-rose-400' },
  { id: 'pets', label: '🐕 Pets & Animals', color: 'bg-lime-500/20 border-lime-500/50 text-lime-400' },
  { id: 'travel', label: '✈️ Travel & Exploration', color: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Basic info, 2: Interests, 3: OTP verification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [selectedInterests, setSelectedInterests] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Step-3 state
  const [otp, setOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const [info, setInfo] = useState('')

  // Cooldown ticker for the Resend button.
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const toggleInterest = (interestId) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    )
  }

  const handleNextStep = () => {
    // Basic completeness check
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all fields')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address')
      return
    }
    // University domain gate — blocks gmail / yahoo / outlook etc. RIGHT HERE
    // so the user can never proceed to the interests step with a bad email.
    const uni = resolveUniversity(formData.email)
    if (!uni.valid) {
      setError(
        uni.reason ||
          'iFLARE is exclusive to Indian college students. Please use your official university email.'
      )
      return
    }
    setError('')
    setStep(2)
  }

  // Step 2 → 3: request an OTP; do NOT create the account yet.
  const handleStartSignup = async () => {
    if (selectedInterests.length < 3) {
      setError('Please select at least 3 interests to build your persona')
      return
    }

    setIsLoading(true)
    setError('')
    setInfo('')

    try {
      const response = await fetch('/api/auth/signup/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          interests: selectedInterests,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Could not send verification code')
        setIsLoading(false)
        return
      }

      setInfo(`We sent a 6-digit code to ${formData.email.trim().toLowerCase()}.`)
      setOtp('')
      setResendCooldown(60)
      setStep(3)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: verify OTP → creates the account.
  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim()
    if (!/^\d{6}$/.test(trimmedOtp)) {
      setError('Enter the 6-digit code from your email')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: trimmedOtp,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Verification failed')
        setIsLoading(false)
        return
      }

      localStorage.setItem('iflare_user', JSON.stringify(data.user))
      localStorage.setItem('iflare_token', data.token)
      router.push('/flares')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return
    setResendLoading(true)
    setError('')
    setInfo('')
    try {
      const response = await fetch('/api/auth/signup/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Could not resend code')
      } else {
        setInfo('A new code has been sent.')
        setResendCooldown(60)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col px-6 py-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => {
            if (step === 1) router.push('/login')
            else if (step === 2) setStep(1)
            else setStep(2)
          }}
          className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <Radar className="w-6 h-6 text-orange-500" />
          <span className="font-bold text-lg">iFLARE</span>
        </div>
        
        <div className="w-10" />
      </div>

      {/* Progress indicator */}
      <div className="flex gap-2 mb-8">
        <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-orange-500' : 'bg-slate-700'}`} />
        <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-orange-500' : 'bg-slate-700'}`} />
        <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-orange-500' : 'bg-slate-700'}`} />
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
        /* Step 1: Basic Info */
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-slate-400 mb-8">Join iFLARE and start connecting</p>

          <div className="space-y-4 mb-8">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  className="h-14 pl-12 bg-slate-800/50 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">College Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. you@sst.scaler.com or you@iitkgp.ac.in"
                  className="h-14 pl-12 bg-slate-800/50 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-orange-500"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                iFLARE is exclusive to students of Indian universities. Use your official college email.
              </p>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password (min 6 characters)"
                  className="h-14 pl-12 bg-slate-800/50 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <Button
              onClick={handleNextStep}
              disabled={!formData.name || !formData.email || !formData.password}
              className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <p className="text-center text-slate-500 text-sm mt-6">
              Already have an account?{' '}
              <a href="/login" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
                Sign in
              </a>
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        /* Step 2: Interests Selection */
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold mb-2">What interests you?</h1>
          <p className="text-slate-400 mb-2">Select at least 3 interests to personalize your experience</p>
          <p className="text-orange-400 text-sm mb-6">✨ This builds your persona for better matches</p>

          <div className="flex flex-wrap gap-3 mb-8">
            {INTEREST_CATEGORIES.map((interest) => (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                className={`px-4 py-3 rounded-xl border transition-all duration-200 flex items-center gap-2 ${
                  selectedInterests.includes(interest.id)
                    ? `${interest.color} scale-105`
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="text-sm font-medium">{interest.label}</span>
                {selectedInterests.includes(interest.id) && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-auto">
            <p className="text-center text-slate-500 text-sm mb-4">
              {selectedInterests.length} of 3 minimum selected
            </p>
            <Button
              onClick={handleStartSignup}
              disabled={selectedInterests.length < 3 || isLoading}
              className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending code...
                </span>
              ) : (
                <>
                  Send verification code
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        /* Step 3: OTP Verification */
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold mb-2">Verify your email</h1>
          <p className="text-slate-400 mb-6">
            Enter the 6-digit code we sent to <span className="text-orange-400">{formData.email.trim().toLowerCase()}</span>
          </p>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Verification code</label>
            <Input
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setError('')
                setInfo('')
                // Only accept digits, cap at 6.
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }}
              placeholder="123456"
              className="h-14 text-center text-2xl tracking-[0.5em] bg-slate-800/50 border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:border-orange-500"
            />
            <p className="text-xs text-slate-500 mt-2">
              Code expires in 10 minutes. Check your spam folder if you don&apos;t see it.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || resendLoading}
            className="mt-4 text-sm text-orange-400 hover:text-orange-300 disabled:text-slate-600 disabled:cursor-not-allowed self-start"
          >
            {resendLoading
              ? 'Sending…'
              : resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : 'Resend code'}
          </button>

          <div className="mt-auto">
            <Button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || isLoading}
              className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </span>
              ) : (
                <>
                  Verify & create account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-slate-600 text-xs mt-6">
        By signing up, you agree to our Terms & Privacy Policy
      </p>
    </main>
  )
}
