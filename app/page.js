'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Flame, Sparkles, Users, MapPin, ArrowRight } from 'lucide-react'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo and App Name */}
      <div className={`flex flex-col items-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Animated Flame Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-orange-500/30 blur-3xl rounded-full w-32 h-32 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 animate-pulse" />
          <Flame className="w-20 h-20 text-orange-500 relative z-10" strokeWidth={1.5} />
        </div>

        {/* App Name */}
        <h1 className="text-5xl font-bold tracking-tight mb-3">
          <span className="text-white">i</span>
          <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            FLARE
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-slate-400 text-lg text-center mb-10">
          Real connections. Right now.
        </p>
      </div>

      {/* Feature highlights */}
      <div className={`flex flex-col gap-4 mb-10 w-full max-w-xs transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-3 text-slate-300">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-orange-400" />
          </div>
          <span className="text-sm">Discover spontaneous meetups</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-orange-400" />
          </div>
          <span className="text-sm">Connect with like-minded people</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-orange-400" />
          </div>
          <span className="text-sm">Find activities near you</span>
        </div>
      </div>

      {/* CTA Button */}
      <div className={`w-full max-w-xs transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <Button 
          className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg rounded-2xl shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30 hover:scale-[1.02]"
          onClick={() => window.location.href = '/register'}
        >
          Get Started
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        
        <p className="text-center text-slate-500 text-sm mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-orange-400 hover:text-orange-300 transition-colors">
            Sign in
          </a>
        </p>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-slate-600 text-xs">
        © 2025 iFLARE. All rights reserved.
      </p>
    </main>
  )
}
