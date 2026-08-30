'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Radar,
  Sparkles,
  Users,
  MapPin,
  ArrowRight,
  Clock,
  GraduationCap,
  MessageSquareHeart,
} from 'lucide-react'

// Illustrative only — these are not live flares. They use the real product
// vocabulary (title / location / start time / participants) so the landing
// page previews what the feed actually looks like after signup.
const SAMPLE_FLARES = [
  {
    emoji: '🏋️',
    title: 'Leg day, need a spotter',
    location: 'Campus Gym',
    startsIn: 'in 40 min',
    participants: '2 of 3',
    accent: 'text-green-400 border-green-500/30 bg-green-500/10',
  },
  {
    emoji: '☕',
    title: 'Coffee run before class',
    location: 'Main Gate Cafe',
    startsIn: 'in 15 min',
    participants: '1 of 4',
    accent: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  },
  {
    emoji: '📚',
    title: 'DSA revision, quiet study',
    location: 'Central Library',
    startsIn: 'in 1 hr',
    participants: '3 of 5',
    accent: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  {
    emoji: '🚴',
    title: 'Evening ride around campus',
    location: 'Hostel Block C',
    startsIn: 'in 25 min',
    participants: '2 of 6',
    accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
]

export default function Home() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const reveal = (delay = '') =>
    `transition-all duration-500 ${delay} ${
      isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
    }`

  return (
    // One solid surface, shared with the rest of the app (--background).
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="relative app-column px-6 py-14">
        {/* Brand + tagline + description */}
        <section className={`flex flex-col items-center text-center ${reveal()}`}>
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-orange-500/40 bg-orange-500/10">
            <Radar className="h-7 w-7 text-orange-500" strokeWidth={1.75} />
          </div>

          <h1 className="mb-2 text-4xl font-semibold tracking-tight text-white">
            <span className="text-slate-400">i</span>
            <span className="text-orange-500">FLARE</span>
          </h1>

          <p className="mb-4 text-sm text-orange-400">Real connections. Right now.</p>

          <p className="max-w-sm text-balance text-sm leading-relaxed text-slate-400">
            Spontaneous meetups with people at your own university. Post what
            you&apos;re doing in the next hour — a gym session, a coffee run, a
            study grind — and find someone on campus to do it with.
          </p>
        </section>

        {/* Primary + secondary CTAs */}
        <section className={`mt-9 flex flex-col gap-3 ${reveal('delay-100')}`}>
          <Button
            className="h-12 w-full rounded-lg bg-orange-600 text-base font-medium text-white transition-colors hover:bg-orange-700"
            onClick={() => router.push('/register')}
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="h-12 w-full rounded-lg border-slate-700 bg-transparent text-base font-medium text-slate-200 transition-colors hover:bg-slate-800/60 hover:text-white"
            onClick={() => router.push('/login')}
          >
            Sign In
          </Button>

          <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
            <GraduationCap className="h-3.5 w-3.5" />
            Open to students at Indian universities
          </p>
        </section>

        {/* Sample iFlares */}
        <section className={`mt-14 ${reveal('delay-200')}`}>
          <h2 className="mb-1 text-sm font-semibold text-white">
            What an iFlare looks like
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            A few examples. You&apos;ll only ever see flares from your own campus.
          </p>

          <ul className="flex flex-col gap-2.5">
            {SAMPLE_FLARES.map((flare) => (
              <li
                key={flare.title}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base ${flare.accent}`}
                    aria-hidden
                  >
                    {flare.emoji}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {flare.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {flare.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {flare.participants}
                      </span>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                    {flare.startsIn}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Why it works */}
        <section className={`mt-12 flex flex-col gap-3 ${reveal('delay-300')}`}>
          {[
            { icon: Sparkles, text: 'Spontaneous — plans for the next hour, not next month' },
            { icon: Users, text: 'Campus-only — verified by your university email' },
            { icon: Clock, text: 'Flares go live 90 minutes before they start' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-300"
            >
              <Icon className="h-4 w-4 shrink-0 text-orange-500" />
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </section>

        {/* Feedback entry point */}
        <section className={`mt-12 ${reveal('delay-300')}`}>
          <Link
            href="/feedback"
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3.5 transition-colors hover:border-slate-700 hover:bg-slate-900/70"
          >
            <span className="flex items-center gap-3">
              <MessageSquareHeart className="h-4 w-4 shrink-0 text-orange-500" />
              <span className="text-sm text-slate-300">
                Got an idea or found a bug? Tell us.
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-14 border-t border-slate-900 pt-6">
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <Link href="/about" className="transition-colors hover:text-slate-300">
              About
            </Link>
            <Link href="/contact" className="transition-colors hover:text-slate-300">
              Contact
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-slate-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-slate-300">
              Terms
            </Link>
          </nav>
          <p className="mt-4 text-center text-xs text-slate-600">
            iFLARE · Campus meetups, made spontaneous
          </p>
        </footer>
      </div>
    </main>
  )
}
