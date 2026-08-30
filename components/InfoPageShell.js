'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, Radar } from 'lucide-react'

// Only signed-in visitors ever render the app chrome, and only after mount —
// loading it lazily keeps the sidebar/sheet bundle off the public pages.
const AppShell = dynamic(() => import('@/components/AppShell'), { ssr: false })

/**
 * Chrome for the informational pages (About, Contact, Privacy, Terms,
 * Feedback).
 *
 * These routes sit outside the (app) route group because the landing footer
 * links to them while logged out, so they can't be moved there without breaking
 * public access. But they're also in the authenticated sidebar — and opening
 * one used to drop the signed-in user into public chrome, with a Back link that
 * sent them to the marketing landing page.
 *
 * So the shell picks its chrome from the session rather than the route: signed
 * in gets the full AppShell (sidebar, header, Back to /flares), signed out gets
 * the public page it always was. One shell, two chromes, no duplicated content.
 *
 * The pages that use this stay server components exporting `metadata`; only
 * this wrapper is a client component.
 */
export default function InfoPageShell({ title, subtitle, children }) {
  // 'unknown' until localStorage has been read on mount — rendering a Back link
  // before then would point at the wrong place for half the visitors.
  const [session, setSession] = useState('unknown')

  useEffect(() => {
    try {
      setSession(window.localStorage.getItem('iflare_user') ? 'in' : 'out')
    } catch (e) {
      setSession('out') // storage blocked — treat as a public visitor
    }
  }, [])

  const signedIn = session === 'in'

  const body = (
    <>
      {session !== 'unknown' && (
        <Link
          href={signedIn ? '/flares' : '/'}
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      )}

      <header className="mt-8 border-b border-slate-800 pb-6">
        {/* The app chrome already carries the wordmark when signed in. */}
        {!signedIn && (
          <div className="mb-4 flex items-center gap-2">
            <Radar className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-bold tracking-tight">
              <span className="text-slate-400">i</span>
              <span className="text-orange-500">FLARE</span>
            </span>
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
      </header>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-slate-300">
        {children}
      </div>

      {/* Signed-in users reach these from the sidebar instead. */}
      {!signedIn && (
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
        </footer>
      )}
    </>
  )

  // AppShell already provides the .app-column content wrapper.
  if (signedIn) return <AppShell>{body}</AppShell>

  return (
    <main className="min-h-screen bg-background">
      <div className="app-column px-6 py-10">{body}</div>
    </main>
  )
}

export function InfoSection({ heading, children }) {
  return (
    <section>
      {heading && (
        <h2 className="mb-2 text-base font-semibold text-white">{heading}</h2>
      )}
      <div className="flex flex-col gap-3 text-slate-400">{children}</div>
    </section>
  )
}
