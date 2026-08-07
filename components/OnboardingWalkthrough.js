'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Radar, Plus, Bell, User, ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react'

const STORAGE_KEY = 'iflare_onboarding_seen'

const SLIDES = [
  {
    icon: Sparkles,
    title: 'Welcome to iFLARE',
    body: "Real connections. Right now. iFLARE helps you spark spontaneous meetups with students from your own campus — study buddies, gym partners, coffee runs, jam sessions and more.",
  },
  {
    icon: Radar,
    title: 'Your Flares Feed',
    body: "This is your home tab. You'll see live iFlares from other students at your university, ranked by your interests. Tap any flare to view details or join it.",
  },
  {
    icon: Plus,
    title: 'Create an iFlare',
    body: "Tap the orange “+” button any time to start your own iFlare — pick a title, venue, start time and interest tags. Others from your campus will see it in their feed.",
  },
  {
    icon: Bell,
    title: 'Track Your Activity',
    body: "The Activity tab shows every iFlare you’ve created and every one you’ve joined, so nothing gets lost. You'll also get in-app alerts when new matching flares appear.",
  },
  {
    icon: User,
    title: 'Your Profile',
    body: "Manage your interests any time from the Profile tab. Your university is auto-detected from your college email — you only see flares from your own campus community.",
  },
]

export default function OnboardingWalkthrough() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const seen = window.localStorage.getItem(STORAGE_KEY)
      if (!seen) setVisible(true)
    } catch (e) {
      // ignore storage errors
    }
  }, [])

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch (e) {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  const total = SLIDES.length
  const slide = SLIDES[step]
  const Icon = slide.icon
  const isLast = step === total - 1

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-xl shadow-xl p-6 relative">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          aria-label="Skip walkthrough"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-5 mt-2">
          <div className="w-14 h-14 rounded-lg border border-orange-500/40 bg-orange-500/10 flex items-center justify-center">
            <Icon className="w-7 h-7 text-orange-500" strokeWidth={1.75} />
          </div>
        </div>

        {/* Title & body */}
        <h2 className="text-xl font-semibold text-center text-white mb-3">{slide.title}</h2>
        <p className="text-slate-400 text-sm text-center leading-relaxed mb-8 min-h-[80px]">
          {slide.body}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step ? 'w-5 bg-orange-500' : 'w-1 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {step > 0 ? (
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              className="flex-1 h-11 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={dismiss}
              className="flex-1 h-11 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800"
            >
              Skip
            </Button>
          )}

          <Button
            onClick={() => (isLast ? dismiss() : setStep(step + 1))}
            className="flex-1 h-11 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium"
          >
            {isLast ? "Let's go" : 'Next'}
            {!isLast && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
