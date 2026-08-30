'use client'

import Link from 'next/link'
import { Menu, Radar, X } from 'lucide-react'

import AppSidebar from '@/components/AppSidebar'
import OnboardingWalkthrough from '@/components/OnboardingWalkthrough'
import SwipeToToggleSidebar from '@/components/SwipeToToggleSidebar'
import { SidebarInset, SidebarProvider, useSidebar } from '@/components/ui/sidebar'

/**
 * The authenticated application chrome: sidebar, mobile header, onboarding.
 *
 * Extracted out of app/(app)/layout.js so the informational pages (About,
 * Contact, Feedback, Privacy, Terms) can reuse it. Those routes live *outside*
 * the (app) group — the logged-out landing footer links to them, so they can't
 * assume a session — but a logged-in user opening one from the sidebar must not
 * lose the sidebar. InfoPageShell decides which chrome to wrap its content in;
 * this component is the authenticated half.
 *
 * Layout intent, unchanged: one mobile-style vertical column at every viewport.
 * Desktop spends its extra width on the sidebar, not on a wider column.
 */
export default function AppShell({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        {/* The sidebar collapses to an off-canvas sheet below md, so mobile
            needs a persistent affordance to open it. */}
        <MobileSidebarToggle />

        <div className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-800/60 bg-slate-950/90 px-3 backdrop-blur md:hidden">
          {/* Reserves the space the fixed toggle sits in, so nothing shifts
              when the icon swaps. */}
          <span aria-hidden className="w-11 shrink-0" />
          <Brand />
        </div>

        <div className="app-column flex-1 px-4 pb-10 pt-4">{children}</div>
      </SidebarInset>

      <SwipeToToggleSidebar />

      {/* Mounted here rather than inside /flares so it survives whichever
          authenticated page a new user lands on first. */}
      <OnboardingWalkthrough />
    </SidebarProvider>
  )
}

/** iFLARE wordmark + brand mark, top-left on every viewport. */
function Brand() {
  return (
    <Link href="/flares" className="flex items-center gap-2" aria-label="iFLARE home">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-600">
        <Radar className="h-5 w-5 text-white" strokeWidth={2} />
      </span>
      <span className="text-lg font-bold tracking-tight">
        <span className="text-slate-400">i</span>
        <span className="text-orange-500">FLARE</span>
      </span>
    </Link>
  )
}

/**
 * Menu ⇄ close button for the mobile sidebar.
 *
 * Fixed rather than laid out in the header for one reason: the sheet in
 * components/ui/sidebar.jsx hides its own close button (`[&>button]:hidden`),
 * so once the sidebar is open there is no other way out but the overlay. This
 * button sits above the overlay (z-[60]) and turns into an X, giving the open
 * state an unmistakable close control in the place the user just tapped.
 */
function MobileSidebarToggle() {
  const { openMobile, toggleSidebar } = useSidebar()

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={openMobile ? 'Close menu' : 'Open menu'}
      aria-expanded={openMobile}
      className="fixed left-3 top-2.5 z-[60] flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white shadow-lg shadow-black/40 transition-transform active:scale-95 md:hidden"
    >
      <span className="relative block h-5 w-5">
        <Menu
          className={`absolute inset-0 h-5 w-5 transition-all duration-200 ${
            openMobile ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <X
          className={`absolute inset-0 h-5 w-5 transition-all duration-200 ${
            openMobile ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'
          }`}
        />
      </span>
    </button>
  )
}
