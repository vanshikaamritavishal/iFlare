'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Flame, Plus, MapPin, Clock, Users, Search, Filter,
  Calendar, ChevronRight, Sparkles, X, Navigation,
  Home, Bell, User, Check
} from 'lucide-react'

// Mock user data (would come from auth context in real app)
const CURRENT_USER = {
  id: 'user-1',
  name: 'John Doe',
  interests: ['sports', 'music', 'food', 'tech']
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

// Sample iFlares data (would come from API)
const SAMPLE_FLARES = [
  {
    id: 'flare-1',
    title: 'Morning Basketball Game',
    description: 'Looking for players for a friendly 3v3 basketball match at the park.',
    interest: 'sports',
    location: { name: 'Central Park Courts', lat: 40.785091, lng: -73.968285 },
    dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    host: { id: 'user-2', name: 'Mike Chen' },
    attendees: [{ id: 'user-3', name: 'Sarah' }, { id: 'user-4', name: 'Tom' }],
    maxAttendees: 6,
    isLive: true
  },
  {
    id: 'flare-2',
    title: 'Live Jazz Night',
    description: 'Great jazz band playing tonight. Anyone want to join?',
    interest: 'music',
    location: { name: 'Blue Note Jazz Club', lat: 40.730610, lng: -74.000080 },
    dateTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    host: { id: 'user-5', name: 'Emily Rose' },
    attendees: [{ id: 'user-6', name: 'David' }],
    maxAttendees: 4,
    isLive: true
  },
  {
    id: 'flare-3',
    title: 'Taco Tuesday Crawl',
    description: 'Let\'s explore the best taco spots in downtown!',
    interest: 'food',
    location: { name: 'Downtown Food District', lat: 40.758896, lng: -73.985130 },
    dateTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    host: { id: 'user-7', name: 'Carlos M.' },
    attendees: [{ id: 'user-8', name: 'Lisa' }, { id: 'user-9', name: 'James' }, { id: 'user-10', name: 'Anna' }],
    maxAttendees: 8,
    isLive: true
  },
  {
    id: 'flare-4',
    title: 'Hackathon Prep Session',
    description: 'Prepping for the weekend hackathon. Brainstorm ideas together!',
    interest: 'tech',
    location: { name: 'TechHub Coworking', lat: 40.741895, lng: -73.989308 },
    dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    host: { id: 'user-11', name: 'Alex Dev' },
    attendees: [],
    maxAttendees: 5,
    isLive: false
  },
]

export default function FlaresPage() {
  const [flares, setFlares] = useState(SAMPLE_FLARES)
  const [filteredFlares, setFilteredFlares] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedFlare, setSelectedFlare] = useState(null)

  // Filter flares based on user interests and active filter
  useEffect(() => {
    let filtered = flares.filter(flare => 
      CURRENT_USER.interests.includes(flare.interest)
    )
    
    if (activeFilter !== 'all') {
      filtered = filtered.filter(flare => flare.interest === activeFilter)
    }
    
    if (searchQuery) {
      filtered = filtered.filter(flare => 
        flare.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flare.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    setFilteredFlares(filtered)
  }, [flares, activeFilter, searchQuery])

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date - now
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Starting soon'
    if (diffHours < 24) return `In ${diffHours}h`
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
  }

  const handleJoinFlare = (flareId) => {
    setFlares(prev => prev.map(flare => {
      if (flare.id === flareId && flare.attendees.length < flare.maxAttendees) {
        return {
          ...flare,
          attendees: [...flare.attendees, { id: CURRENT_USER.id, name: CURRENT_USER.name }]
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
          {CURRENT_USER.interests.map(interest => (
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

      {/* Live Now Section */}
      <section className="px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="font-semibold text-lg">Live Now</h2>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {filteredFlares.filter(f => f.isLive).map(flare => (
            <div
              key={flare.id}
              onClick={() => setSelectedFlare(flare)}
              className="flex-shrink-0 w-72 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-4 border border-slate-700/50 cursor-pointer hover:border-orange-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${INTEREST_MAP[flare.interest]?.color}`}>
                  {INTEREST_MAP[flare.interest]?.label}
                </span>
                <span className="flex items-center gap-1 text-xs text-orange-400">
                  <Clock className="w-3 h-3" />
                  {formatTime(flare.dateTime)}
                </span>
              </div>
              
              <h3 className="font-semibold mb-1 line-clamp-1">{flare.title}</h3>
              <p className="text-sm text-slate-400 mb-3 line-clamp-2">{flare.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{flare.location.name}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-orange-400">{flare.attendees.length}/{flare.maxAttendees}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* All iFlares Section */}
      <section className="px-4 py-4">
        <h2 className="font-semibold text-lg mb-3">Happening Soon</h2>
        
        <div className="space-y-3">
          {filteredFlares.map(flare => (
            <div
              key={flare.id}
              onClick={() => setSelectedFlare(flare)}
              className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 cursor-pointer hover:border-orange-500/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center text-2xl">
                  {INTEREST_MAP[flare.interest]?.label.split(' ')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold line-clamp-1">{flare.title}</h3>
                    <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  </div>
                  <p className="text-sm text-slate-400 mb-2 line-clamp-1">{flare.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {flare.location.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(flare.dateTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {flare.attendees.length}/{flare.maxAttendees}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredFlares.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No iFlares found matching your interests</p>
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
          currentUser={CURRENT_USER}
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
          userInterests={CURRENT_USER.interests}
        />
      )}
    </main>
  )
}

// Flare Detail Modal Component
function FlareDetailModal({ flare, onClose, onJoin, currentUser }) {
  const isAttending = flare.attendees.some(a => a.id === currentUser.id)
  const isFull = flare.attendees.length >= flare.maxAttendees
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
          {/* Interest badge */}
          <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium border mb-3 ${INTEREST_MAP[flare.interest]?.color}`}>
            {INTEREST_MAP[flare.interest]?.label}
          </span>

          <h2 className="text-2xl font-bold mb-2">{flare.title}</h2>
          <p className="text-slate-400 mb-4">{flare.description}</p>

          {/* Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="font-medium">{new Date(flare.dateTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                <p className="text-sm text-slate-500">{new Date(flare.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                <User className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="font-medium">Hosted by {flare.host.name}</p>
                <p className="text-sm text-slate-500">{flare.attendees.length} of {flare.maxAttendees} spots filled</p>
              </div>
            </div>
          </div>

          {/* Attendees */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Who's Going</h3>
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
              className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg rounded-2xl"
            >
              Join this iFlare
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Create Flare Modal Component
function CreateFlareModal({ onClose, onCreated, userInterests }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    interest: userInterests[0] || 'social',
    location: { name: '', lat: 40.758896, lng: -73.985130 },
    date: '',
    time: '',
    maxAttendees: 4
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = () => {
    setIsSubmitting(true)
    
    const newFlare = {
      id: `flare-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      interest: formData.interest,
      location: formData.location,
      dateTime: new Date(`${formData.date}T${formData.time}`).toISOString(),
      host: { id: CURRENT_USER.id, name: CURRENT_USER.name },
      attendees: [],
      maxAttendees: formData.maxAttendees,
      isLive: true
    }
    
    setTimeout(() => {
      onCreated(newFlare)
    }, 1000)
  }

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

        <div className="p-6">
          {step === 1 && (
            /* Step 1: Basic Info */
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">What's happening?</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Beach Volleyball Game"
                  className="h-14 bg-slate-800/50 border-slate-700 rounded-xl text-white"
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Tell people more</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your iFlare..."
                  rows={3}
                  className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 resize-none"
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {userInterests.map(interest => (
                    <button
                      key={interest}
                      onClick={() => setFormData({ ...formData, interest })}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        formData.interest === interest
                          ? INTEREST_MAP[interest]?.color + ' scale-105'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400'
                      }`}
                    >
                      {INTEREST_MAP[interest]?.label}
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
            /* Step 2: Location & Time */
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
              <div className="h-40 rounded-xl overflow-hidden">
                <MapPlaceholder location={formData.location} isSelectable />
              </div>
              <p className="text-xs text-slate-500 text-center">📍 Google Maps integration coming soon - location will be shown here</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="h-14 bg-slate-800/50 border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Time</label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="h-14 bg-slate-800/50 border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Max attendees</label>
                <div className="flex gap-2">
                  {[2, 4, 6, 8, 10].map(num => (
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

              <div className="flex gap-3 mt-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 h-14 border-slate-700 text-white rounded-2xl"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!formData.location.name || !formData.date || !formData.time || isSubmitting}
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
        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 animate-bounce">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div className="w-4 h-4 bg-orange-500/30 rounded-full mt-1" />
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
