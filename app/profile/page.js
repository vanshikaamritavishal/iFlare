'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Flame, User, Bell, Search, ArrowLeft, Check, 
  LogOut, Loader2, Globe, Users, MapPin, Building
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

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [selectedInterests, setSelectedInterests] = useState([])
  const [visibilityMode, setVisibilityMode] = useState('locality') // 'community' or 'locality'
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Get email domain for community display
  const getEmailDomain = (email) => {
    if (!email) return ''
    const parts = email.split('@')
    return parts.length > 1 ? `@${parts[1]}` : ''
  }

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = localStorage.getItem('iflare_user')
        const token = localStorage.getItem('iflare_token')
        
        if (!storedUser || !token) {
          router.push('/login')
          return
        }

        const userData = JSON.parse(storedUser)
        setUser(userData)
        setSelectedInterests(userData.interests || [])
        setVisibilityMode(userData.visibilityMode || 'locality')
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
        newInterests.some(i => !originalInterests.includes(i)) ||
        visibilityMode !== (user?.visibilityMode || 'locality')
      setHasChanges(isDifferent)
      
      return newInterests
    })
  }

  const handleVisibilityChange = (mode) => {
    setVisibilityMode(mode)
    const originalMode = user?.visibilityMode || 'locality'
    const originalInterests = user?.interests || []
    const interestsDifferent = selectedInterests.length !== originalInterests.length ||
      selectedInterests.some(i => !originalInterests.includes(i))
    setHasChanges(mode !== originalMode || interestsDifferent)
  }

  const handleSaveSettings = async () => {
    if (selectedInterests.length < 3) {
      alert('Please select at least 3 interests')
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem('iflare_token')
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          interests: selectedInterests,
          visibilityMode: visibilityMode
        })
      })

      if (response.ok) {
        // Update local storage and state
        const updatedUser = { ...user, interests: selectedInterests, visibilityMode }
        localStorage.setItem('iflare_user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        setHasChanges(false)
        alert('Settings saved successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save settings')
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

      <div className="px-4 py-6">
        {/* User Info */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-2xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Visibility Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">iFlare Visibility</h3>
          <p className="text-sm text-slate-400 mb-4">
            Choose who can see and publish iFlares with you
          </p>

          <div className="space-y-3">
            {/* Community Option */}
            <button
              onClick={() => handleVisibilityChange('community')}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                visibilityMode === 'community'
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  visibilityMode === 'community' ? 'bg-orange-500' : 'bg-slate-700'
                }`}>
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">My Community Only</h4>
                    {visibilityMode === 'community' && (
                      <Check className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    See & publish iFlares only with people from your organization
                  </p>
                  <p className="text-xs text-orange-400 mt-2 font-medium">
                    {getEmailDomain(user?.email)} community
                  </p>
                </div>
              </div>
            </button>

            {/* Locality Option */}
            <button
              onClick={() => handleVisibilityChange('locality')}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                visibilityMode === 'locality'
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  visibilityMode === 'locality' ? 'bg-orange-500' : 'bg-slate-700'
                }`}>
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Open to Nearby</h4>
                    {visibilityMode === 'locality' && (
                      <Check className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    See & publish iFlares with everyone within your locality
                  </p>
                  <p className="text-xs text-orange-400 mt-2 font-medium">
                    📍 Within 2km of your location
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Interests */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">My Interests</h3>
          <p className="text-sm text-slate-400 mb-4">
            Select interests to see relevant iFlares. Minimum 3 required.
          </p>
          
          <div className="flex flex-wrap gap-3">
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
          
          <p className="text-sm text-slate-500 mt-3">
            {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <Button
            onClick={handleSaveSettings}
            disabled={selectedInterests.length < 3 || isSaving}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-2xl"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </Button>
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
          <button 
            onClick={() => router.push('/activity')}
            className="flex flex-col items-center gap-1 text-slate-500"
          >
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
