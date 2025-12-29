'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Flame, Plus, MapPin, Clock, Users, Search, Filter,
  Calendar, ChevronRight, Sparkles, X, Navigation,
  Home, Bell, User, Check, AlertCircle, Timer
} from 'lucide-react'

// Mock user data (would come from auth context in real app)
// Will be replaced with actual user data from localStorage
const DEFAULT_USER = {
  id: 'user-1',
  name: 'John Doe',
  interests: ['sports', 'music', 'food', 'tech', 'wellness']
}

// Interest categories mapping
const INTEREST_MAP = {
  sports: { label: '🏃 Sports & Fitness', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  music: { label: '🎵 Music & Concerts', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  food: { label: '🍕 Food & Dining', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  art: { label: '🎨 Art & Culture', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  tech: { label: '💻 Tech & Gaming', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  outdoor: { label: '🏕️ Outdoor', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  nightlife: { label: '🌙 Nightlife', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  wellness: { label: '🧘 Wellness', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  learning: { label: '📚 Learning', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  social: { label: '☕ Social', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  pets: { label: '🐕 Pets', color: 'bg-lime-500/20 text-lime-400 border-lime-500/30' },
  travel: { label: '✈️ Travel', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
}

// All interest categories for selection
const ALL_INTERESTS = [
  { id: 'sports', label: '🏃 Sports & Fitness' },
  { id: 'music', label: '🎵 Music & Concerts' },
  { id: 'food', label: '🍕 Food & Dining' },
  { id: 'art', label: '🎨 Art & Culture' },
  { id: 'tech', label: '💻 Tech & Gaming' },
  { id: 'outdoor', label: '🏕️ Outdoor & Adventure' },
  { id: 'nightlife', label: '🌙 Nightlife & Parties' },
  { id: 'wellness', label: '🧘 Wellness & Mindfulness' },
  { id: 'learning', label: '📚 Learning & Workshops' },
  { id: 'social', label: '☕ Casual Hangouts' },
  { id: 'pets', label: '🐕 Pets & Animals' },
  { id: 'travel', label: '✈️ Travel & Exploration' },
]

// Sample iFlares data - with startTime for 90-min window logic
const generateSampleFlares = () => {
  const now = new Date()
  return [
    {
      id: 'flare-1',
      title: 'Looking for Gym Buddy',
      description: 'Need a workout partner for chest and triceps day. Intermediate level preferred.',
      interests: ['sports', 'wellness'], // Multiple interests
      location: { name: 'Gold\'s Gym Downtown', lat: 40.785091, lng: -73.968285 },
      startTime: new Date(now.getTime() + 45 * 60 * 1000).toISOString(), // 45 mins from now
      host: { id: 'user-2', name: 'Mike Chen' },
      attendees: [{ id: 'user-3', name: 'Sarah' }],
      maxAttendees: 3,
    },
    {
      id: 'flare-2',
      title: 'Board Game Night - Catan',
      description: 'Looking for 2 more players for Settlers of Catan. Beginners welcome!',
      interests: ['social', 'tech'],
      location: { name: 'The Game Parlour', lat: 40.730610, lng: -74.000080 },
      startTime: new Date(now.getTime() + 20 * 60 * 1000).toISOString(), // 20 mins from now - URGENT!
      host: { id: 'user-5', name: 'Emily Rose' },
      attendees: [{ id: 'user-6', name: 'David' }],
      maxAttendees: 4,
    },
    {
      id: 'flare-3',
      title: 'Evening Cycling Group',
      description: 'Casual 10km ride through the park. Bring your own bike!',
      interests: ['sports', 'outdoor', 'wellness'],
      location: { name: 'Central Park South Entrance', lat: 40.758896, lng: -73.985130 },
      startTime: new Date(now.getTime() + 75 * 60 * 1000).toISOString(), // 75 mins from now
      host: { id: 'user-7', name: 'Carlos M.' },
      attendees: [{ id: 'user-8', name: 'Lisa' }, { id: 'user-9', name: 'James' }],
      maxAttendees: 6,
    },
    {
      id: 'flare-4',
      title: 'Coffee & Code Session',
      description: 'Working on side projects together. All skill levels welcome!',
      interests: ['tech', 'social', 'learning'],
      location: { name: 'Blue Bottle Coffee', lat: 40.741895, lng: -73.989308 },
      startTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), // 60 mins from now
      host: { id: 'user-11', name: 'Alex Dev' },
      attendees: [],
      maxAttendees: 5,
    },
    {
      id: 'flare-5',
      title: 'Jam Session - Guitar Players',
      description: 'Acoustic jam session. Bring your guitar and let\'s play!',
      interests: ['music', 'social'],
      location: { name: 'Melody Studios', lat: 40.741895, lng: -73.989308 },
      startTime: new Date(now.getTime() + 30 * 60 * 1000).toISOString(), // 30 mins from now
      host: { id: 'user-12', name: 'Jazz Pete' },
      attendees: [{ id: 'user-13', name: 'Maria' }],
      maxAttendees: 4,
    },
    {
      id: 'flare-6',
      title: 'Quick Tennis Match',
      description: 'Singles or doubles, looking for players now!',
      interests: ['sports'],
      location: { name: 'Riverside Tennis Courts', lat: 40.741895, lng: -73.989308 },
      startTime: new Date(now.getTime() + 10 * 60 * 1000).toISOString(), // 10 mins - VERY URGENT!
      host: { id: 'user-14', name: 'Serena K.' },
      attendees: [],
      maxAttendees: 4,
    },
    // This one is outside 90-min window - should NOT show
    {
      id: 'flare-7',
      title: 'Weekend Hiking Trip',
      description: 'Planning a group hike this weekend.',
      interests: ['outdoor', 'sports'],
      location: { name: 'Bear Mountain', lat: 40.741895, lng: -73.989308 },
      startTime: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now - NOT SHOWN
      host: { id: 'user-15', name: 'Hiker Joe' },
      attendees: [],
      maxAttendees: 8,
    },
  ]
}

export default function FlaresPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(DEFAULT_USER)
  const [flares, setFlares] = useState([])
  const [filteredFlares, setFilteredFlares] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
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

  // Initialize flares
  useEffect(() => {
    setFlares(generateSampleFlares())
  }, [])

  // Update current time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  // Filter and sort flares based on:
  // 1. User interests match
  // 2. Within 90-min window
  // 3. Sorted by urgency (less time = higher priority)
  useEffect(() => {
    const now = currentTime
    const ninetyMinsFromNow = new Date(now.getTime() + 90 * 60 * 1000)
    
    let filtered = flares.filter(flare => {
      // Check if any of user's interests match any of flare's interests
      const hasMatchingInterest = flare.interests.some(interest => 
        currentUser.interests.includes(interest)
      )
      
      // Check if within 90-min window (start time is within next 90 mins)
      const startTime = new Date(flare.startTime)
      const isWithinWindow = startTime >= now && startTime <= ninetyMinsFromNow
      
      return hasMatchingInterest && isWithinWindow
    })
    
    // Apply interest filter if not 'all'
    if (activeFilter !== 'all') {
      filtered = filtered.filter(flare => flare.interests.includes(activeFilter))
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(flare => 
        flare.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flare.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Sort by urgency - less time remaining = higher priority
    filtered.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime() - now.getTime()
      const timeB = new Date(b.startTime).getTime() - now.getTime()
      return timeA - timeB // Ascending order - closest first
    })
    
    setFilteredFlares(filtered)
  }, [flares, activeFilter, searchQuery, currentTime])

  // Get time remaining and urgency level
  const getTimeInfo = (startTime) => {
    const now = new Date()
    const start = new Date(startTime)
    const diffMs = start - now
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins <= 0) return { text: 'Starting now!', urgency: 'critical', mins: 0 }
    if (diffMins <= 15) return { text: `${diffMins} min`, urgency: 'critical', mins: diffMins }
    if (diffMins <= 30) return { text: `${diffMins} min`, urgency: 'high', mins: diffMins }
    if (diffMins <= 60) return { text: `${diffMins} min`, urgency: 'medium', mins: diffMins }
    return { text: `${diffMins} min`, urgency: 'normal', mins: diffMins }
  }

  const getUrgencyStyles = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50'
    }
  }

  const handleJoinFlare = (flareId) => {
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
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-7 h-7 text-orange-500" />
              <span className="font-bold text-xl">iFLARE</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search iFlares near you..."
              className="w-full h-12 pl-10 bg-slate-800/50 border-slate-700 rounded-xl text-white placeholder:text-slate-500"
            />
          </div>
        </div>
        
        {/* Interest filters */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            All
          </button>
          {currentUser.interests.map(interest => (
            <button
              key={interest}
              onClick={() => setActiveFilter(interest)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === interest
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              {INTEREST_MAP[interest]?.label.split(' ')[0]} {interest.charAt(0).toUpperCase() + interest.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* 90-min Window Notice */}
      <div className="px-4 py-3 bg-orange-500/10 border-b border-orange-500/20">
        <div className="flex items-center gap-2 text-sm text-orange-400">
          <Timer className="w-4 h-4" />
          <span>Showing iFlares starting within 90 minutes • Sorted by urgency</span>
        </div>
      </div>

      {/* Urgent iFlares - Starting Soon */}
      {filteredFlares.filter(f => getTimeInfo(f.startTime).urgency === 'critical').length > 0 && (
        <section className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h2 className="font-semibold text-lg text-red-400">Starting Very Soon!</h2>
          </div>
          
          <div className="space-y-3">
            {filteredFlares.filter(f => getTimeInfo(f.startTime).urgency === 'critical').map(flare => (
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

      {/* All iFlares Section */}
      <section className="px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-lg">Happening Soon</h2>
          <span className="text-sm text-slate-500">({filteredFlares.length} iFlares)</span>
        </div>
        
        <div className="space-y-3">
          {filteredFlares.filter(f => getTimeInfo(f.startTime).urgency !== 'critical').map(flare => (
            <FlareCard 
              key={flare.id} 
              flare={flare} 
              onClick={() => setSelectedFlare(flare)}
              timeInfo={getTimeInfo(flare.startTime)}
              getUrgencyStyles={getUrgencyStyles}
            />
          ))}
        </div>
        
        {filteredFlares.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No iFlares in the next 90 minutes</p>
            <p className="text-sm text-slate-500 mt-1">Be the first to create one!</p>
          </div>
        )}
      </section>

      {/* Floating Create Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/50 px-6 py-3 z-40">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-1 text-orange-500">
            <Flame className="w-6 h-6" />
            <span className="text-xs">Flares</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-500">
            <Search className="w-6 h-6" />
            <span className="text-xs">Explore</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-500">
            <Bell className="w-6 h-6" />
            <span className="text-xs">Activity</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-500">
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>

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

      {/* Create Flare Modal */}
      {showCreateModal && (
        <CreateFlareModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newFlare) => {
            setFlares(prev => [newFlare, ...prev])
            setShowCreateModal(false)
          }}
        />
      )}
    </main>
  )
}

// Flare Card Component
function FlareCard({ flare, onClick, timeInfo, getUrgencyStyles }) {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-800/50 rounded-2xl p-4 border cursor-pointer hover:border-orange-500/30 transition-all ${
        timeInfo.urgency === 'critical' ? 'border-red-500/30 bg-red-500/5' : 'border-slate-700/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center text-2xl flex-shrink-0">
          {INTEREST_MAP[flare.interests[0]]?.label.split(' ')[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold line-clamp-1">{flare.title}</h3>
            <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getUrgencyStyles(timeInfo.urgency)}`}>
              {timeInfo.text}
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-2 line-clamp-1">{flare.description}</p>
          
          {/* Interest tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {flare.interests.slice(0, 3).map(interest => (
              <span key={interest} className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400">
                {INTEREST_MAP[interest]?.label.split(' ')[0]}
              </span>
            ))}
            {flare.interests.length > 3 && (
              <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400">
                +{flare.interests.length - 3}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {flare.location.name}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className={flare.attendees.length >= flare.maxAttendees - 1 ? 'text-orange-400' : ''}>
                {flare.attendees.length + 1}/{flare.maxAttendees}
              </span>
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
      </div>
    </div>
  )
}

// Flare Detail Modal Component
function FlareDetailModal({ flare, onClose, onJoin, currentUser, timeInfo, getUrgencyStyles }) {
  const isAttending = flare.attendees.some(a => a.id === currentUser.id)
  const isFull = flare.attendees.length >= flare.maxAttendees - 1 // -1 because host counts
  const isHost = flare.host.id === currentUser.id

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl max-h-[85vh] overflow-y-auto">
        {/* Map placeholder */}
        <div className="relative h-48 bg-slate-800">
          <MapPlaceholder location={flare.location} />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-900/80 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Urgency badge */}
          <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl border font-bold ${getUrgencyStyles(timeInfo.urgency)}`}>
            <div className="flex items-center gap-1">
              <Timer className="w-4 h-4" />
              <span>Starts in {timeInfo.text}</span>
            </div>
          </div>
          
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur rounded-xl p-3 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-orange-400" />
            <div>
              <p className="font-medium text-sm">{flare.location.name}</p>
              <p className="text-xs text-slate-400">Tap for directions</p>
            </div>
            <Navigation className="w-5 h-5 text-orange-400 ml-auto" />
          </div>
        </div>

        <div className="p-6">
          {/* Interest badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {flare.interests.map(interest => (
              <span key={interest} className={`px-3 py-1 rounded-lg text-sm font-medium border ${INTEREST_MAP[interest]?.color}`}>
                {INTEREST_MAP[interest]?.label}
              </span>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-2">{flare.title}</h2>
          <p className="text-slate-400 mb-4">{flare.description}</p>

          {/* Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="font-medium">{new Date(flare.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                <p className="text-sm text-slate-500">{new Date(flare.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                <User className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="font-medium">Hosted by {flare.host.name}</p>
                <p className="text-sm text-slate-500">{flare.attendees.length + 1} of {flare.maxAttendees} spots filled</p>
              </div>
            </div>
          </div>

          {/* Attendees */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Who's Going ({flare.attendees.length + 1}/{flare.maxAttendees})</h3>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold">
                  {flare.host.name.charAt(0)}
                </div>
                <span className="text-sm">{flare.host.name}</span>
                <span className="text-xs text-orange-400">Host</span>
              </div>
              {flare.attendees.map(attendee => (
                <div key={attendee.id} className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold">
                    {attendee.name.charAt(0)}
                  </div>
                  <span className="text-sm">{attendee.name}</span>
                </div>
              ))}
              {Array.from({ length: flare.maxAttendees - flare.attendees.length - 1 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                    <Plus className="w-3 h-3 text-slate-500" />
                  </div>
                  <span className="text-sm text-slate-500">Open spot</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action button */}
          {isHost ? (
            <Button className="w-full h-14 bg-slate-700 text-white font-semibold text-lg rounded-2xl" disabled>
              You're hosting this iFlare
            </Button>
          ) : isAttending ? (
            <Button className="w-full h-14 bg-green-600 text-white font-semibold text-lg rounded-2xl" disabled>
              <Check className="w-5 h-5 mr-2" />
              You're going!
            </Button>
          ) : isFull ? (
            <Button className="w-full h-14 bg-slate-700 text-white font-semibold text-lg rounded-2xl" disabled>
              This iFlare is full
            </Button>
          ) : (
            <Button
              onClick={onJoin}
              className={`w-full h-14 text-white font-semibold text-lg rounded-2xl ${
                timeInfo.urgency === 'critical' 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 animate-pulse'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
              }`}
            >
              {timeInfo.urgency === 'critical' ? '🔥 Join Now!' : 'Join this iFlare'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Create Flare Modal Component
function CreateFlareModal({ onClose, onCreated }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    interests: [], // Multiple interests
    location: { name: '', lat: 40.758896, lng: -73.985130 },
    date: new Date().toISOString().split('T')[0],
    time: '',
    maxAttendees: 4
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleInterest = (interestId) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }))
  }

  const handleCreate = () => {
    if (formData.interests.length === 0) {
      alert('Please select at least one interest category')
      return
    }
    
    setIsSubmitting(true)
    
    const newFlare = {
      id: `flare-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      interests: formData.interests,
      location: formData.location,
      startTime: new Date(`${formData.date}T${formData.time}`).toISOString(),
      host: { id: CURRENT_USER.id, name: CURRENT_USER.name },
      attendees: [],
      maxAttendees: formData.maxAttendees,
    }
    
    setTimeout(() => {
      onCreated(newFlare)
    }, 1000)
  }

  // Example activities for placeholder
  const exampleActivities = [
    "Looking for gym buddy",
    "Going for cycling",
    "Slots for board game",
    "Tennis match needed",
    "Coffee & coding session",
    "Evening jog partner"
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">Create iFlare</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 flex gap-2">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-orange-500' : 'bg-slate-700'}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-orange-500' : 'bg-slate-700'}`} />
        </div>

        <div className="p-6">
          {step === 1 && (
            /* Step 1: Activity Details */
            <div className="space-y-4">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-medium text-orange-400 mb-2">💡 iFlare Ideas</h3>
                <div className="flex flex-wrap gap-2">
                  {exampleActivities.map(example => (
                    <button
                      key={example}
                      onClick={() => setFormData({ ...formData, title: example })}
                      className="px-3 py-1.5 bg-slate-800/50 rounded-lg text-xs text-slate-300 hover:bg-slate-700/50"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">What activity are you planning?</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Looking for gym buddy"
                  className="h-14 bg-slate-800/50 border-slate-700 rounded-xl text-white"
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Tell people more</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your activity, skill level, what to bring..."
                  rows={3}
                  className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 resize-none"
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Participants needed <span className="text-orange-400">(2-10)</span>
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6, 8, 10].map(num => (
                    <button
                      key={num}
                      onClick={() => setFormData({ ...formData, maxAttendees: num })}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                        formData.maxAttendees === num
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!formData.title || !formData.description}
                className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-2xl mt-4"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            /* Step 2: Location, Time & Interest Categories */
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Where is it?</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    value={formData.location.name}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, name: e.target.value } })}
                    placeholder="Enter venue or address"
                    className="h-14 pl-12 bg-slate-800/50 border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Map placeholder */}
              <div className="h-32 rounded-xl overflow-hidden">
                <MapPlaceholder location={formData.location} isSelectable />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none z-10" />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full h-14 pl-12 pr-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Start Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none z-10" />
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full h-14 pl-12 pr-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>

              {/* Interest Categories Selection - REQUIRED */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Who should see this? <span className="text-orange-400">Select all applicable interests</span>
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Your iFlare will be shown to users with matching interests
                </p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {ALL_INTERESTS.map(interest => (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-1 ${
                        formData.interests.includes(interest.id)
                          ? INTEREST_MAP[interest.id]?.color + ' scale-105'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400'
                      }`}
                    >
                      {interest.label}
                      {formData.interests.includes(interest.id) && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
                {formData.interests.length > 0 && (
                  <p className="text-xs text-orange-400 mt-2">
                    ✓ {formData.interests.length} category(ies) selected
                  </p>
                )}
              </div>

              {/* Info about 90-min display */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-xs text-blue-400">
                  <Timer className="w-4 h-4 inline mr-1" />
                  Your iFlare will appear on dashboards <strong>90 minutes before</strong> the start time, 
                  prioritized by urgency for users with matching interests.
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  onClick={() => setStep(1)}
                  className="flex-1 h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-2xl"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!formData.location.name || !formData.time || formData.interests.length === 0 || isSubmitting}
                  className="flex-1 h-14 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-2xl"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <>Create iFlare <Flame className="w-5 h-5 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Map Placeholder Component (to be replaced with Google Maps)
function MapPlaceholder({ location, isSelectable = false }) {
  return (
    <div className="w-full h-full bg-slate-800 relative flex items-center justify-center">
      {/* Static map background pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#475569" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Map pin */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 animate-bounce">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div className="w-3 h-3 bg-orange-500/30 rounded-full mt-1" />
      </div>
      
      {/* Location text */}
      {location?.name && (
        <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur rounded-lg px-3 py-2">
          <p className="text-sm text-white truncate">{location.name}</p>
        </div>
      )}
      
      {/* Coming soon badge */}
      {isSelectable && (
        <div className="absolute top-2 right-2 bg-orange-500/20 border border-orange-500/30 rounded-lg px-2 py-1">
          <span className="text-xs text-orange-400">Maps Coming Soon</span>
        </div>
      )}
    </div>
  )
}
