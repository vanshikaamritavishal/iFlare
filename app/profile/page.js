'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Flame, User, Bell, Search, ArrowLeft, Check, 
  MapPin, Clock, Users, Calendar, LogOut, Settings,
  ChevronRight, Loader2
} from 'lucide-react'

// All interest categories
const ALL_INTERESTS = [
  { id: 'sports', label: '🏃 Sports & Fitness', color: 'bg-green-500/20 border-green-500/50 text-green-400' },
  { id: 'music', label: '🎵 Music & Concerts', color: 'bg-purple-500/20 border-purple-500/50 text-purple-400' },
  { id: 'food', label: '🍕 Food & Dining', color: 'bg-orange-500/20 border-orange-500/50 text-orange-400' },
  { id: 'art', label: '🎨 Art & Culture', color: 'bg-pink-500/20 border-pink-500/50 text-pink-400' },
  { id: 'tech', label: '💻 Tech & Gaming', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400' },
  { id: 'outdoor', label: '🏕️ Outdoor & Adventure', color: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' },
  { id: 'nightlife', label: '🌙 Nightlife & Parties', color: 'bg-violet-500/20 border-violet-500/50 text-violet-400' },
  { id: 'wellness', label: '🧘 Wellness & Mindfulness', color: 'bg-teal-500/20 border-teal-500/50 text-teal-400' },
  { id: 'learning', label: '📚 Learning & Workshops', color: 'bg-amber-500/20 border-amber-500/50 text-amber-400' },
  { id: 'social', label: '☕ Casual Hangouts', color: 'bg-rose-500/20 border-rose-500/50 text-rose-400' },
  { id: 'pets', label: '🐕 Pets & Animals', color: 'bg-lime-500/20 border-lime-500/50 text-lime-400' },
  { id: 'travel', label: '✈️ Travel & Exploration', color: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' },
]

// Interest map for quick lookup
const INTEREST_MAP = Object.fromEntries(ALL_INTERESTS.map(i => [i.id, i]))

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [selectedInterests, setSelectedInterests] = useState([])
  const [joinedFlares, setJoinedFlares] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('flares') // 'interests' or 'flares' - default to flares

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user from localStorage
        const storedUser = localStorage.getItem('iflare_user')
        const token = localStorage.getItem('iflare_token')
        
        if (!storedUser || !token) {
          router.push('/login')
          return
        }

        const userData = JSON.parse(storedUser)
        setUser(userData)
        setSelectedInterests(userData.interests || [])

        // Fetch joined flares
        const response = await fetch(`/api/user/${userData.id}/flares`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setJoinedFlares(data.flares || [])
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const toggleInterest = (interestId) => {
    setSelectedInterests(prev => {
      const newInterests = prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
      
      // Check if different from original
      const originalInterests = user?.interests || []
      const isDifferent = newInterests.length !== originalInterests.length ||
        newInterests.some(i => !originalInterests.includes(i))
      setHasChanges(isDifferent)
      
      return newInterests
    })
  }

  const handleSaveInterests = async () => {
    if (selectedInterests.length < 3) {
      alert('Please select at least 3 interests')
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem('iflare_token')
      const response = await fetch('/api/user/interests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          interests: selectedInterests
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Update local storage and state
        const updatedUser = { ...user, interests: selectedInterests }
        localStorage.setItem('iflare_user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        setHasChanges(false)
        alert('Interests updated successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update interests')
      }
    } catch (err) {
      alert('Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('iflare_user')
    localStorage.removeItem('iflare_token')
    router.push('/login')
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/flares')}
              className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Profile</h1>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-red-400"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* User Info */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-2xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{selectedInterests.length}</p>
            <p className="text-sm text-slate-400">Interests</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{joinedFlares.length}</p>
            <p className="text-sm text-slate-400">iFlares Joined</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('interests')}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'interests'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-800/50 text-slate-400'
            }`}
          >
            My Interests
          </button>
          <button
            onClick={() => setActiveTab('flares')}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'flares'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-800/50 text-slate-400'
            }`}
          >
            Joined iFlares
          </button>
        </div>

        {/* Interests Tab */}
        {activeTab === 'interests' && (
          <div>
            <p className="text-slate-400 text-sm mb-4">
              Select your interests to see relevant iFlares. Minimum 3 required.
            </p>
            
            <div className="flex flex-wrap gap-3 mb-6">
              {ALL_INTERESTS.map((interest) => (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={`px-4 py-3 rounded-xl border transition-all duration-200 flex items-center gap-2 ${
                    selectedInterests.includes(interest.id)
                      ? `${interest.color} scale-105`
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="text-sm font-medium">{interest.label}</span>
                  {selectedInterests.includes(interest.id) && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>

            {hasChanges && (
              <Button
                onClick={handleSaveInterests}
                disabled={selectedInterests.length < 3 || isSaving}
                className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-2xl"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <>Save Changes ({selectedInterests.length} selected)</>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Joined Flares Tab */}
        {activeTab === 'flares' && (
          <div>
            {joinedFlares.length === 0 ? (
              <div className="text-center py-12">
                <Flame className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">You haven't joined any iFlares yet</p>
                <p className="text-sm text-slate-500 mt-1">Explore and join iFlares to see them here</p>
                <Button
                  onClick={() => router.push('/flares')}
                  className="mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl"
                >
                  Explore iFlares
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {joinedFlares.map(flare => {
                  const { date, time } = formatDateTime(flare.startTime)
                  const interestInfo = INTEREST_MAP[flare.interests?.[0]] || {}
                  
                  return (
                    <div
                      key={flare.id}
                      className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                          {interestInfo.label?.split(' ')[0] || '🔥'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold line-clamp-1">{flare.title}</h3>
                          <p className="text-sm text-slate-400 mb-2 line-clamp-1">{flare.description}</p>
                          
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {flare.location?.name || 'TBD'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-400">
                              Hosted by {flare.host?.name}
                            </span>
                            <span className="text-xs text-orange-400">
                              • {(flare.attendees?.length || 0) + 1}/{flare.maxAttendees} going
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/50 px-6 py-3 z-40">
        <div className="flex items-center justify-around">
          <button 
            onClick={() => router.push('/flares')}
            className="flex flex-col items-center gap-1 text-slate-500"
          >
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
          <button className="flex flex-col items-center gap-1 text-orange-500">
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </main>
  )
}
