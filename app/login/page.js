'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Radar, ArrowLeft, Eye, EyeOff, Mail, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleLogin = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Login failed')
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
    <main className="min-h-screen flex flex-col px-6 py-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={() => router.push('/')}
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

      {/* Login Form */}
      <div className="flex-1 flex flex-col">
        <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
        <p className="text-slate-400 mb-8">Sign in to continue to iFLARE</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="h-14 pl-12 bg-slate-800/50 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Password</label>
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="h-14 bg-slate-800/50 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-orange-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <button className="text-orange-400 text-sm mb-8 text-left hover:text-orange-300 transition-colors">
          Forgot password?
        </button>

        <div className="mt-auto">
          <Button
            onClick={handleLogin}
            disabled={!formData.email || !formData.password || isLoading}
            className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
          
          <p className="text-center text-slate-500 text-sm mt-6">
            Still not registered?{' '}
            <a href="/register" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
