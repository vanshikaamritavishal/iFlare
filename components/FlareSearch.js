'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X, Sparkles } from 'lucide-react'
import { INTERESTS, INTEREST_MAP } from '@/lib/interests'

/**
 * Feed search with interest recommendations that appear on focus.
 *
 * Recommendations combine the user's own interests (from users.interests) with
 * generally popular ones, deduped and with the user's own listed first — the
 * point is that a newly-focused search field suggests something useful rather
 * than sitting empty.
 *
 * Searching stays entirely client-side over the already-fetched, already
 * university-scoped feed; no new endpoint is involved.
 */

// Fallback suggestions for users whose own interests are few or very niche.
const POPULAR_INTEREST_IDS = ['sports', 'social', 'food', 'tech', 'learning']

export default function FlareSearch({
  value,
  onChange,
  userInterests = [],
  activeFilter,
  onFilterChange,
}) {
  const [focused, setFocused] = useState(false)
  const containerRef = useRef(null)

  const recommended = useMemo(() => {
    const mine = userInterests.filter((id) => INTEREST_MAP[id])
    const ids = [...new Set([...mine, ...POPULAR_INTEREST_IDS])].slice(0, 8)
    return ids.map((id) => ({ ...INTEREST_MAP[id], isMine: mine.includes(id) }))
  }, [userInterests])

  // Close the suggestion panel on an outside click.
  useEffect(() => {
    if (!focused) return
    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) setFocused(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [focused])

  const pickInterest = (id) => {
    onFilterChange(activeFilter === id ? 'all' : id)
    setFocused(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            // Enter confirms the query and dismisses the suggestions; the feed
            // already filters as you type, so there is nothing to submit.
            if (e.key === 'Enter') {
              e.preventDefault()
              setFocused(false)
              e.currentTarget.blur()
            }
            if (e.key === 'Escape') setFocused(false)
          }}
          placeholder="Search iFlares near you..."
          aria-label="Search iFlares"
          className="h-12 w-full rounded-xl border-slate-700 bg-slate-800/50 pl-10 pr-10 text-white placeholder:text-slate-500 focus:border-orange-500"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {focused && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Sparkles className="h-3 w-3 text-orange-400" />
            Browse by interest
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recommended.map((interest) => {
              const selected = activeFilter === interest.id
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => pickInterest(interest.id)}
                  aria-pressed={selected}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                      : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
                  }`}
                >
                  {interest.emoji} {interest.name}
                  {interest.isMine && (
                    <span className="ml-0.5 text-[10px] text-orange-400/80">yours</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
