'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Radar, Plus, Clock, Sparkles, Bell, Zap } from 'lucide-react'
import { useNotificationContext } from '@/lib/NotificationProvider'
import FlareCard from '@/components/FlareCard'
import FlareDetailModal from '@/components/FlareDetailModal'
import CreateFlareForm from '@/components/CreateFlareForm'
import FlareSearch from '@/components/FlareSearch'

// Default until the stored user loads from localStorage.
const DEFAULT_USER = {
  id: null,
  name: '',
  interests: []
}

export default function FlaresPage() {
  const router = useRouter()
  const {
    permission,
    hasAskedPermission,
    requestPermission,
    unreadCount,
  } = useNotificationContext()

  const [currentUser, setCurrentUser] = useState(DEFAULT_USER)
  const [flares, setFlares] = useState([])
  const [filteredFlares, setFilteredFlares] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  // 'join' (default) or 'create' — replaces the old floating-button modal.
  const [mode, setMode] = useState('join')
  const [selectedFlare, setSelectedFlare] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('iflare_user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setCurrentUser(userData)
      } catch (e) {
        console.error('Error parsing user data')
      }
    }
  }, [])

  // If arriving from the Activity page with a specific flare to open,
  // pick it up from sessionStorage and open its detail modal.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = sessionStorage.getItem('iflare_open_flare')
    if (!raw) return
    try {
      const flareToOpen = JSON.parse(raw)
      if (flareToOpen && flareToOpen.id) {
        setFlares(prev =>
          prev.some(f => f.id === flareToOpen.id) ? prev : [flareToOpen, ...prev]
        )
        setSelectedFlare(flareToOpen)
      }
    } catch (e) {
      // ignore malformed payloads
    } finally {
      sessionStorage.removeItem('iflare_open_flare')
    }
  }, [])

  // Initialize flares - fetch from database (scoped to user's university via API)
  useEffect(() => {
    const fetchFlares = async () => {
      try {
        const token = localStorage.getItem('iflare_token')
        const interests = currentUser.interests.join(',')

        // Fetch real flares from database - server scopes by requesting user's email domain
        const response = await fetch(
          `/api/flares?interests=${interests}&userId=${encodeURIComponent(currentUser.id || '')}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        )

        if (response.ok) {
          const dbFlares = await response.json()
          setFlares(Array.isArray(dbFlares) ? dbFlares : [])
        } else {
          setFlares([])
        }
      } catch (err) {
        console.error('Error fetching flares:', err)
        setFlares([])
      }
    }

    if (currentUser?.id) {
      fetchFlares()
    }
  }, [currentUser.interests, currentUser.id])

  // Update current time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  // Filter and sort flares based on:
  // 1. Visibility window: 90 min before start → 30 min after start
  // 2. User interests match
  // 3. Sorted by start time
  useEffect(() => {
    const nowMs = currentTime.getTime()
    const windowStart = nowMs - 30 * 60 * 1000  // events that started up to 30 min ago
    const windowEnd = nowMs + 90 * 60 * 1000    // events starting within the next 90 min

    let filtered = flares.filter(flare => {
      const startMs = new Date(flare.startTime).getTime()
      if (isNaN(startMs)) return false
      // Inside the visibility window?
      if (startMs <= windowStart || startMs > windowEnd) return false
      // Interest match?
      return flare.interests?.some(interest => currentUser.interests.includes(interest))
    })

    // Apply interest filter if not 'all'
    if (activeFilter !== 'all') {
      filtered = filtered.filter(flare => flare.interests?.includes(activeFilter))
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(flare =>
        flare.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flare.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort by start time - upcoming first
    filtered.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime()
      const timeB = new Date(b.startTime).getTime()
      return timeA - timeB
    })

    setFilteredFlares(filtered)
  }, [flares, activeFilter, searchQuery, currentTime, currentUser.interests])

  // Get time remaining/elapsed and urgency level.
  // - Positive diff: "in X min" (Starting Soon)
  // - Non-positive diff: "started X min ago" (Happening Now, up to 30 min old)
  const getTimeInfo = (startTime) => {
    const now = new Date()
    const start = new Date(startTime)
    const diffMs = start - now
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins > 0) {
      if (diffMins <= 15) return { text: `${diffMins} min`, urgency: 'critical', mins: diffMins }
      if (diffMins <= 30) return { text: `${diffMins} min`, urgency: 'high', mins: diffMins }
      if (diffMins <= 60) return { text: `${diffMins} min`, urgency: 'medium', mins: diffMins }
      return { text: `${diffMins} min`, urgency: 'normal', mins: diffMins }
    }
    // Started already — Happening Now if within 30 min buffer, otherwise Ended.
    const ago = -diffMins
    if (ago <= 30) {
      return {
        text: ago === 0 ? 'Just started' : `Started ${ago} min ago`,
        urgency: 'happening',
        mins: diffMins,
      }
    }
    return { text: 'Ended', urgency: 'ended', mins: diffMins }
  }

  const getUrgencyStyles = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'happening':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'ended':
        return 'bg-slate-700/40 text-slate-400 border-slate-600/50'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50'
    }
  }

  // Asking for notification permission is deferred until the user has actually
  // done something (joined or created), so the request has obvious context
  // instead of firing on a timer the moment the feed loads.
  const maybeAskForNotifications = () => {
    if (hasAskedPermission || permission !== 'default') return
    setTimeout(() => requestPermission(), 600)
  }

  const handleJoinFlare = async (flareId) => {
    // Update local state immediately for UI
    setFlares(prev => prev.map(flare => {
      if (flare.id === flareId && flare.attendees.length < flare.maxAttendees) {
        return {
          ...flare,
          attendees: [...flare.attendees, { id: currentUser.id, name: currentUser.name }]
        }
      }
      return flare
    }))
    setSelectedFlare(null)

    // Save to database
    try {
      const token = localStorage.getItem('iflare_token')
      await fetch(`/api/flares/${flareId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          // Also save the flare data for profile display
          flareData: flares.find(f => f.id === flareId)
        })
      })
      maybeAskForNotifications()
    } catch (err) {
      console.error('Error joining flare:', err)
    }
  }

  const handleFlareCreated = (newFlare) => {
    setFlares(prev => [newFlare, ...prev])
    // No notification here: this flare is the user's own, and being told your
    // own flare matches your interests is noise. Other users are notified
    // through notifyNewFlare, which now refuses to fire on your own flare.
    maybeAskForNotifications()
    // Created flares live in Activity — that's where the user can find and
    // manage them, so land them there rather than back on a feed the flare
    // may not even appear in yet.
    router.push('/activity')
  }

  const startingSoon = filteredFlares.filter(f => getTimeInfo(f.startTime).mins > 0)
  const happeningNow = filteredFlares.filter(f => getTimeInfo(f.startTime).mins <= 0)

  return (
    <main>
      {/* Header */}
      <header className="mb-4 flex items-center justify-between gap-2 py-2">
        {/* The shell owns the wordmark now — sidebar on desktop, sticky bar on
            mobile — so this header is just the page title. */}
        <h1 className="text-xl font-bold tracking-tight">Flares</h1>

        <Link
          href="/notifications"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/50 text-slate-400 transition-colors hover:text-white"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </header>

      {/* Mode switch — Join is the default */}
      <div
        role="tablist"
        aria-label="Flare mode"
        className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-1"
      >
        {[
          { id: 'join', label: 'Join iFlare', icon: Zap },
          { id: 'create', label: 'Create iFlare', icon: Plus },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors ${
              mode === id
                ? 'bg-orange-600 text-white shadow'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ---------------- Join mode ---------------- */}
      {mode === 'join' && (
        <>
          <div className="mb-4">
            <FlareSearch
              value={searchQuery}
              onChange={setSearchQuery}
              userInterests={currentUser.interests}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </div>

          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300"
            >
              Filtered by {activeFilter} · clear
            </button>
          )}

          <div className="mb-5 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-orange-400">
              <Radar className="h-4 w-4" />
              <span>
                {filteredFlares.length} flare{filteredFlares.length === 1 ? '' : 's'} matching
                your interests
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-orange-300/80">
              <Clock className="h-3 w-3" />
              iFlares appear 90 minutes before they start and drop off once they begin.
            </p>
          </div>

          {startingSoon.length > 0 && (
            <section className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-400" />
                <h2 className="text-lg font-semibold">Starting Soon</h2>
                <span className="text-sm text-slate-500">{startingSoon.length}</span>
              </div>
              <div className="space-y-3">
                {startingSoon.map(flare => (
                  <FlareCard
                    key={flare.id}
                    flare={flare}
                    onClick={() => setSelectedFlare(flare)}
                    timeInfo={getTimeInfo(flare.startTime)}
                    getUrgencyStyles={getUrgencyStyles}
                  />
                ))}
              </div>
            </section>
          )}

          {happeningNow.length > 0 && (
            <section className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-400" />
                <h2 className="text-lg font-semibold">Happening Now</h2>
                <span className="text-sm text-slate-500">{happeningNow.length}</span>
              </div>
              <div className="space-y-3">
                {happeningNow.map(flare => (
                  <FlareCard
                    key={flare.id}
                    flare={flare}
                    onClick={() => setSelectedFlare(flare)}
                    timeInfo={getTimeInfo(flare.startTime)}
                    getUrgencyStyles={getUrgencyStyles}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredFlares.length === 0 && (
            <div className="py-12 text-center">
              <Sparkles className="mx-auto mb-3 h-12 w-12 text-slate-600" />
              <p className="text-slate-400">
                {searchQuery || activeFilter !== 'all'
                  ? 'Nothing matches that right now'
                  : 'No iFlares in the next 90 minutes'}
              </p>
              <p className="mt-1 text-sm text-slate-500">Be the first to create one!</p>
            </div>
          )}

          {/* Create prompt at the end of the feed */}
          <div className="mt-2 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-5 text-center">
            <p className="mb-1 font-medium text-white">Nothing here for you?</p>
            <p className="mb-4 text-sm text-slate-400">
              Post what you&apos;re doing and let people come to you.
            </p>
            <Button
              onClick={() => setMode('create')}
              className="h-12 w-full rounded-xl bg-orange-600 font-semibold text-white hover:bg-orange-700"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create an iFlare
            </Button>
          </div>
        </>
      )}

      {/* ---------------- Create mode ---------------- */}
      {mode === 'create' && (
        <CreateFlareForm
          currentUser={currentUser}
          onCreated={handleFlareCreated}
          onCancel={() => setMode('join')}
        />
      )}

      {/* Flare Detail Modal */}
      {selectedFlare && (
        <FlareDetailModal
          flare={selectedFlare}
          onClose={() => setSelectedFlare(null)}
          onJoin={() => handleJoinFlare(selectedFlare.id)}
          currentUser={currentUser}
          timeInfo={getTimeInfo(selectedFlare.startTime)}
          getUrgencyStyles={getUrgencyStyles}
        />
      )}
    </main>
  )
}
