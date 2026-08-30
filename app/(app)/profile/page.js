'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Check, LogOut, Loader2, Building } from 'lucide-react'
import { INTERESTS } from '@/lib/interests'

const MIN_INTERESTS = 3
const BIO_MAX_LENGTH = 300

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [selectedInterests, setSelectedInterests] = useState([])
  const [bio, setBio] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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
        setBio(userData.bio || '')

        // The cached copy predates the bio field for existing accounts, so
        // refresh from the server and reconcile.
        const response = await fetch('/api/user/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const { user: fresh } = await response.json()
          setUser(fresh)
          setSelectedInterests(fresh.interests || [])
          setBio(fresh.bio || '')
          localStorage.setItem('iflare_user', JSON.stringify(fresh))
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
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    )
  }

  const originalInterests = user?.interests || []
  const interestsChanged =
    selectedInterests.length !== originalInterests.length ||
    selectedInterests.some(i => !originalInterests.includes(i))
  const bioChanged = bio.trim() !== (user?.bio || '')
  const hasChanges = interestsChanged || bioChanged

  const handleSaveSettings = async () => {
    if (selectedInterests.length < MIN_INTERESTS) {
      toast.error(`Please select at least ${MIN_INTERESTS} interests`)
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
          bio: bio.trim()
        })
      })

      if (response.ok) {
        // Update local storage and state
        const updatedUser = { ...user, interests: selectedInterests, bio: bio.trim() }
        localStorage.setItem('iflare_user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        toast.success('Profile updated')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save settings')
      }
    } catch (err) {
      toast.error('Something went wrong')
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <main>
      {/* Nav lives in the app shell sidebar; this header only carries the
          page title and the account-level action. */}
      <header className="flex items-center justify-between py-2">
        <h1 className="text-2xl font-bold">Profile</h1>
        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-red-400"
          aria-label="Log out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="py-6">
        {/* User Info */}
        <div className="mb-8 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-orange-600 text-2xl font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">{user?.name}</h2>
            <p className="truncate text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-8">
          <h3 className="mb-2 text-lg font-semibold">About you</h3>
          <p className="mb-4 text-sm text-slate-400">
            A line people see when you host or join a flare. Optional.
          </p>
          {/* Textarea: Enter inserts a newline and must not save. */}
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
            rows={3}
            placeholder="Second year CS. Usually at the gym or the library. Always up for chai."
            className="resize-y rounded-xl border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-orange-500"
          />
          <p className="mt-2 text-right text-xs text-slate-500">
            {bio.length}/{BIO_MAX_LENGTH}
          </p>
        </div>

        {/* University (read-only, derived from email domain) */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Your University</h3>
          <p className="text-sm text-slate-400 mb-4">
            iFlares are shared only within your campus community.
          </p>

          <div className="w-full p-4 rounded-2xl border-2 border-orange-500/40 bg-orange-500/5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">
                  {user?.university || 'Your Campus Community'}
                </h4>
                <p className="text-xs text-orange-400 mt-2 font-medium">
                  {getEmailDomain(user?.email)} community
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  You&rsquo;ll only see and be seen by other students from this domain.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">My Interests</h3>
          <p className="text-sm text-slate-400 mb-4">
            Select interests to see relevant iFlares. Minimum {MIN_INTERESTS} required.
          </p>

          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => {
              const selected = selectedInterests.includes(interest.id)
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggleInterest(interest.id)}
                  aria-pressed={selected}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
                    selected
                      ? interest.color
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {interest.emoji} {interest.name}
                  {selected && <Check className="h-3.5 w-3.5" />}
                </button>
              )
            })}
          </div>

          <p className="text-sm text-slate-500 mt-3">
            {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <Button
            onClick={handleSaveSettings}
            disabled={selectedInterests.length < MIN_INTERESTS || isSaving}
            className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-2xl"
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
    </main>
  )
}
