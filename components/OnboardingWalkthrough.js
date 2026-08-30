'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Radar,
  Plus,
  Bell,
  User,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react'

// Scoped per account: a shared laptop shouldn't swallow the walkthrough for
// the next person who signs in, and a returning user shouldn't see it again.
const storageKeyFor = (userId) => `iflare_onboarding_seen:${userId}`

const SLIDES = [
  {
    icon: Radar,
    title: 'Your flares feed',
    body: "Join is your home screen — live flares from students at your university, matched to your interests. Tap one to see it or join it.",
  },
  {
    icon: Plus,
    title: 'Create your own',
    body: 'Switch to Create at the top to post what you’re doing, how many can join, and where and when.',
  },
  {
    icon: Bell,
    title: 'Timing matters',
    body: 'Flares appear 90 minutes before they start and drop off once they begin. My Activity keeps everything you’ve created or joined.',
  },
  {
    icon: User,
    title: 'Make it yours',
    body: 'The menu has your profile, activity, notifications and settings. Your university comes from your college email.',
  },
]

/**
 * First-run guide.
 *
 * Deliberately *not* a modal: it's a small panel anchored to the bottom of the
 * screen with no backdrop and no blur, so the app it's describing stays visible
 * and fully usable while it's open. It opens by asking whether the user wants a
 * guide at all, and any click outside it — or Escape, or Skip — finishes it for
 * good.
 */
export default function OnboardingWalkthrough() {
  const [visible, setVisible] = useState(false)
  // 'ask' → the do-you-want-a-guide prompt; 'tour' → the slides.
  const [stage, setStage] = useState('ask')
  const [step, setStep] = useState(0)
  const [userId, setUserId] = useState(null)
  const panelRef = useRef(null)

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const storedUser = window.localStorage.getItem('iflare_user')
      if (!storedUser) return // logged out — nothing to introduce yet

      const { id } = JSON.parse(storedUser)
      if (!id) return

      setUserId(id)
      if (!window.localStorage.getItem(storageKeyFor(id))) setVisible(true)
    } catch (e) {
      // ignore storage / parse errors
    }
  }, [])

  const dismiss = () => {
    try {
      if (userId) window.localStorage.setItem(storageKeyFor(userId), '1')
    } catch (e) {
      // ignore
    }
    setVisible(false)
  }

  // Escape and any click outside the panel both leave the tour. There's no
  // overlay to click, so the outside click is detected on the document —
  // which keeps the rest of the app clickable while the panel is open.
  useEffect(() => {
    if (!visible) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') dismiss()
    }
    const onPointerDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) dismiss()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  })

  if (!visible) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Welcome guide"
      className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl shadow-black/60 sm:left-auto sm:bottom-6 sm:right-6 sm:w-[21rem]"
    >
      <button
        onClick={dismiss}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
        aria-label={stage === 'ask' ? 'Dismiss' : 'Skip guide'}
      >
        <X className="h-4 w-4" />
      </button>

      {stage === 'ask' ? (
        <AskStage onYes={() => setStage('tour')} onNo={dismiss} />
      ) : (
        <TourStage step={step} onStep={setStep} onFinish={dismiss} />
      )}
    </div>
  )
}

/** The opening prompt — a guide is offered, never forced. */
function AskStage({ onYes, onNo }) {
  return (
    <>
      <div className="mb-3 flex items-center gap-2.5 pr-7">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-orange-500/40 bg-orange-500/10">
          <Sparkles className="h-4 w-4 text-orange-500" strokeWidth={1.75} />
        </span>
        <h2 className="text-sm font-semibold text-white">Welcome to iFLARE</h2>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-slate-400">
        Want a quick guide? Four short tips on finding flares near you and
        posting your own. Takes about 20 seconds.
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={onNo}
          className="h-9 flex-1 rounded-lg border border-slate-800 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        >
          No thanks
        </Button>
        <Button
          onClick={onYes}
          autoFocus
          className="h-9 flex-1 rounded-lg bg-orange-600 text-xs font-medium text-white hover:bg-orange-700"
        >
          Show me
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </>
  )
}

function TourStage({ step, onStep, onFinish }) {
  const slide = SLIDES[step]
  const Icon = slide.icon
  const total = SLIDES.length
  const isLast = step === total - 1

  return (
    <>
      <div className="mb-3 flex items-center gap-2.5 pr-7">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-orange-500/40 bg-orange-500/10">
          <Icon className="h-4 w-4 text-orange-500" strokeWidth={1.75} />
        </span>
        <h2 className="text-sm font-semibold text-white">{slide.title}</h2>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-slate-400">{slide.body}</p>

      <div className="mb-4 flex items-center gap-1.5">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === step ? 'w-4 bg-orange-500' : 'w-1 bg-slate-700'
            }`}
          />
        ))}
        <span className="ml-auto text-[11px] text-slate-600">
          {step + 1} of {total}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {step > 0 ? (
          <Button
            variant="ghost"
            onClick={() => onStep(step - 1)}
            className="h-9 flex-1 rounded-lg border border-slate-800 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={onFinish}
            className="h-9 flex-1 rounded-lg border border-slate-800 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Skip
          </Button>
        )}

        <Button
          onClick={() => (isLast ? onFinish() : onStep(step + 1))}
          autoFocus
          className="h-9 flex-1 rounded-lg bg-orange-600 text-xs font-medium text-white hover:bg-orange-700"
        >
          {isLast ? "Let's go" : 'Continue'}
          {!isLast && <ArrowRight className="ml-1 h-3.5 w-3.5" />}
        </Button>
      </div>
    </>
  )
}
