'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Radar, MapPin, Clock, Users, Loader2 } from 'lucide-react'
import { INTEREST_MAP, interestLabel } from '@/lib/interests'

export default function ActivityPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [flares, setFlares] = useState({ created: [], joined: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'created', 'joined'

  // Load user data and flares
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = localStorage.getItem('iflare_user')
        const token = localStorage.getItem('iflare_token')
        
        if (!storedUser || !token) {
          router.push('/login')
          return
        }

        const userData = JSON.parse(storedUser)
        setUser(userData)

        // Fetch user's flares (created and joined)
        const response = await fetch(`/api/user/${userData.id}/activity`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setFlares({
            created: data.created || [],
            joined: data.joined || []
          })
        }
      } catch (err) {
        console.error('Error loading activity:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
  }

  const getFilteredFlares = () => {
    if (activeTab === 'created') return flares.created
    if (activeTab === 'joined') return flares.joined
    // 'all' - combine and sort by date
    return [...flares.created, ...flares.joined].sort((a, b) => 
      new Date(b.startTime) - new Date(a.startTime)
    )
  }

  const isCreatedByUser = (flare) => {
    return flare.host?.id === user?.id
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  const filteredFlares = getFilteredFlares()

  return (
    <main>
      {/* Nav lives in the app shell sidebar; this header is title + filters. */}
      <header className="py-2">
        <h1 className="text-2xl font-bold">My Activity</h1>

        {/* Filter Tabs */}
        <div className="pt-4 flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-800/50 text-slate-400'
            }`}
          >
            All ({flares.created.length + flares.joined.length})
          </button>
          <button
            onClick={() => setActiveTab('created')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'created'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-800/50 text-slate-400'
            }`}
          >
            Created ({flares.created.length})
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'joined'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-800/50 text-slate-400'
            }`}
          >
            Joined ({flares.joined.length})
          </button>
        </div>
      </header>

      {/* Visibility helper */}
      <div className="mt-4 rounded-xl px-4 py-3 bg-orange-500/10 border border-orange-500/20">
        <p className="text-xs text-orange-300/90 flex items-start gap-1.5">
          <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>
            Your created flares appear on the Flares feed 90 minutes before start time. All your flares stay here.
          </span>
        </p>
      </div>

      {/* Activity List */}
      <div className="py-4">
        {filteredFlares.length === 0 ? (
          <div className="text-center py-12">
            <Radar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {activeTab === 'created' 
                ? "You haven't created any iFlares yet"
                : activeTab === 'joined'
                ? "You haven't joined any iFlares yet"
                : "No activity yet"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {activeTab === 'created' 
                ? "Create your first iFlare to get started!"
                : "Explore and join iFlares to see them here"}
            </p>
            <button
              onClick={() => router.push('/flares')}
              className="mt-4 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium"
            >
              {activeTab === 'created' ? 'Create iFlare' : 'Explore iFlares'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFlares.map(flare => {
              const { date, time } = formatDateTime(flare.startTime)
              const interestInfo = INTEREST_MAP[flare.interests?.[0]] || {}
              const isCreator = isCreatedByUser(flare)

              const openFlare = () => {
                try {
                  sessionStorage.setItem('iflare_open_flare', JSON.stringify(flare))
                } catch (e) {
                  // sessionStorage might be unavailable — still navigate
                }
                router.push('/flares')
              }

              // A flare is "ended" 30 minutes after its start time.
              const isEnded = (() => {
                const startMs = new Date(flare.startTime).getTime()
                if (isNaN(startMs)) return false
                return Date.now() > startMs + 30 * 60 * 1000
              })()

              return (
                <div
                  key={flare.id}
                  role="button"
                  tabIndex={0}
                  onClick={openFlare}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openFlare()
                    }
                  }}
                  className={`rounded-2xl p-4 border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/40 ${
                    isEnded
                      ? 'bg-slate-900/40 border-slate-800 opacity-70 hover:border-slate-700'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-orange-500/40 hover:bg-slate-800/70'
                  }`}
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        isEnded
                          ? 'bg-slate-700/40 text-slate-500 border border-slate-700'
                          : isCreator
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {isCreator ? '🔥 Created by you' : '✓ Joined'}
                      </span>
                      {isEnded && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide bg-slate-700/40 text-slate-400 border border-slate-600/40">
                          Ended
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{date}</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl flex-shrink-0 ${
                      isEnded
                        ? 'bg-slate-800/60 border-slate-700 grayscale'
                        : 'bg-orange-500/10 border-orange-500/20'
                    }`}>
                      {interestInfo.emoji || '🔥'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold line-clamp-1 ${isEnded ? 'text-slate-400' : ''}`}>{flare.title}</h3>
                      <p className="text-sm text-slate-400 mb-2 line-clamp-1">{flare.description}</p>
                      
                      {/* Interest tags */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {flare.interests?.slice(0, 3).map(interest => (
                          <span key={interest} className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400">
                            {INTEREST_MAP[interest]?.emoji || interest}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {flare.location?.name || 'TBD'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {(flare.attendees?.length || 0) + 1}/{flare.maxAttendees}
                        </span>
                      </div>

                      {!isCreator && (
                        <p className="text-xs text-slate-500 mt-2">
                          Hosted by {flare.host?.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
