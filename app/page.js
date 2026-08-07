'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Radar, Sparkles, Users, MapPin, ArrowRight } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-slate-950 overflow-hidden">
      {/* Subtle grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage:
            'radial-gradient(ellipse at center, black 40%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 40%, transparent 75%)',
        }}
      />

      {/* Logo and App Name */}
      <div
        className={`relative flex flex-col items-center transition-all duration-500 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div className="w-14 h-14 rounded-xl border border-orange-500/40 bg-orange-500/10 flex items-center justify-center mb-6">
          <Radar className="w-7 h-7 text-orange-500" strokeWidth={1.75} />
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">
          <span className="text-slate-400">i</span>
          <span className="text-orange-500">FLARE</span>
        </h1>

        <p className="text-slate-400 text-sm text-center mb-12">
          Real connections. Right now.
        </p>
      </div>

      {/* Feature highlights */}
      <div
        className={`relative flex flex-col gap-3 mb-12 w-full max-w-sm transition-all duration-500 delay-100 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        {[
          { icon: Sparkles, text: 'Discover spontaneous meetups' },
          { icon: Users, text: 'Connect with peers from your campus' },
          { icon: MapPin, text: 'Find activities near you' },
        ].map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 text-slate-300 px-4 py-3 rounded-lg border border-slate-800 bg-slate-900/40"
          >
            <Icon className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <span className="text-sm">{text}</span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div
        className={`relative w-full max-w-sm transition-all duration-500 delay-200 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <Button
          className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
          onClick={() => router.push('/login')}
        >
          Get Started
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <p className="text-center text-slate-500 text-xs mt-4">
          For students of Indian universities
        </p>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-slate-600 text-xs">
        iFLARE · Campus meetups, made spontaneous
      </p>
    </main>
  )
}
