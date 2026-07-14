'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Radar, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link')
        return
      }

      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage('Your email has been verified!')
          
          // Auto-login: store user data
          if (data.user && data.token) {
            localStorage.setItem('iflare_user', JSON.stringify(data.user))
            localStorage.setItem('iflare_token', data.token)
          }
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
        }
      } catch (err) {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    verifyEmail()
  }, [searchParams])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-12">
        <Radar className="w-8 h-8 text-orange-500" />
        <span className="font-bold text-2xl">iFLARE</span>
      </div>

      {status === 'verifying' && (
        <div className="flex flex-col items-center text-center">
          <Loader2 className="w-16 h-16 text-orange-500 animate-spin mb-6" />
          <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
          <p className="text-slate-400">Please wait a moment</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
          <p className="text-slate-400 mb-8">{message}</p>
          <Button
            onClick={() => router.push('/flares')}
            className="w-64 h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-2xl"
          >
            Start Exploring iFlares
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
          <p className="text-slate-400 mb-8">{message}</p>
          <div className="space-y-3 w-64">
            <Button
              onClick={() => router.push('/register')}
              className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-2xl"
            >
              Try Again
            </Button>
            <button
              onClick={() => router.push('/login')}
              className="w-full text-slate-400 hover:text-orange-400 text-sm transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
      </main>
    }>
      <VerifyContent />
    </Suspense>
  )
}
