'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Radar, ArrowLeft, Eye, EyeOff, Mail, Loader2, AlertCircle } from 'lucide-react'
import { resolveUniversity } from '@/lib/universities'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  // The server can't tell us whether an account exists (it returns the same
  // 401 either way, deliberately), so on any failed sign-in we surface the
  // "create an account" route alongside the error.
  const [showSignupHint, setShowSignupHint] = useState(false)
  const [domainError, setDomainError] = useState('')

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
    setShowSignupHint(false)
    if (e.target.name === 'email') setDomainError('')
  }

  // Mirrors the server's own check so a non-university address is caught
  // before we spend a round trip on it. The server remains the authority.
  const validateDomain = () => {
    const email = formData.email.trim()
    if (!email || !email.includes('@')) return true
    const uni = resolveUniversity(email)
    if (!uni.valid) {
      setDomainError(uni.reason || 'This email domain is not allowed on iFLARE.')
      return false
    }
    setDomainError('')
    return true
  }

  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!formData.email || !formData.password || isLoading) return
    if (!validateDomain()) return

    setIsLoading(true)
    setError('')
    setShowSignupHint(false)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        if (response.status === 401) setShowSignupHint(true)
        setIsLoading(false)
        return
      }

      // Store user session
      localStorage.setItem('iflare_user', JSON.stringify(data.user))
      localStorage.setItem('iflare_token', data.token)

      // Redirect to flares page
      router.push('/flares')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="app-column flex min-h-screen flex-col px-6 py-8">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/50 text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <Radar className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold">iFLARE</span>
          </div>

          <div className="w-10" />
        </div>

        {/* Login form — a real <form> so Enter submits from either field. */}
        <form onSubmit={handleLogin} className="flex flex-1 flex-col">
          <h1 className="mb-2 text-2xl font-bold">Welcome back</h1>
          <p className="mb-8 text-slate-400">Sign in to continue to iFLARE</p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <p className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </p>
              {showSignupHint && (
                <p className="mt-2 pl-6 text-slate-400">
                  Don&apos;t have an account yet?{' '}
                  <Link
                    href="/register"
                    className="font-medium text-orange-400 transition-colors hover:text-orange-300"
                  >
                    Create one
                  </Link>
                </p>
              )}
            </div>
          )}

          <div className="mb-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-slate-400">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={validateDomain}
                  aria-invalid={Boolean(domainError)}
                  placeholder="you@university.ac.in"
                  className={`h-14 rounded-xl bg-slate-800/50 pl-12 text-white placeholder:text-slate-500 ${
                    domainError
                      ? 'border-red-500/60 focus:border-red-500'
                      : 'border-slate-700 focus:border-orange-500'
                  }`}
                />
              </div>
              {domainError ? (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-red-400">
                  <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{domainError}</span>
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Use the email your university gave you.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-slate-400">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="h-14 rounded-xl border-slate-700 bg-slate-800/50 pr-12 text-white placeholder:text-slate-500 focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/forgot-password')}
            className="mb-8 text-left text-sm text-orange-400 transition-colors hover:text-orange-300"
          >
            Forgot password?
          </button>

          <div className="mt-auto">
            <Button
              type="submit"
              disabled={!formData.email || !formData.password || isLoading}
              className="h-14 w-full rounded-2xl bg-orange-600 text-lg font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>

            <p className="mt-6 text-center text-sm text-slate-500">
              Still not registered?{' '}
              <Link
                href="/register"
                className="font-medium text-orange-400 transition-colors hover:text-orange-300"
              >
                Get Started
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
