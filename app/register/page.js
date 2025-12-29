'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Flame, ArrowRight, ArrowLeft, Check } from 'lucide-react'

// Interest categories for building user persona
const INTEREST_CATEGORIES = [
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

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // Step 1: Basic info, Step 2: Interests
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [selectedInterests, setSelectedInterests] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const toggleInterest = (interestId) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    )
  }

  const handleNextStep = () => {
    if (formData.name && formData.email && formData.password) {
      setStep(2)
    }
  }

  const handleRegister = async () => {
    if (selectedInterests.length < 3) {
      alert('Please select at least 3 interests to build your persona')
      return
    }
    
    setIsLoading(true)
    // TODO: API call to register user with interests (persona building)
    console.log('Registering with:', { ...formData, interests: selectedInterests })
    
    // Store user data in localStorage for demo purposes
    // In production, this would be handled by auth system
    localStorage.setItem('iflare_user', JSON.stringify({
      name: formData.name,
      email: formData.email,
      interests: selectedInterests
    }))
    
    // Simulate API call then redirect to flares page
    setTimeout(() => {
      setIsLoading(false)
      router.push('/flares')
    }, 1500)
  }

  return (
    <main className="min-h-screen flex flex-col px-6 py-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => step === 1 ? router.push('/') : setStep(1)}
          className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-500" />
          <span className="font-bold text-lg">iFLARE</span>
        </div>
        
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Progress indicator */}
      <div className="flex gap-2 mb-8">
        <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-orange-500' : 'bg-slate-700'}`} />
        <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-orange-500' : 'bg-slate-700'}`} />
      </div>

      {step === 1 ? (
        /* Step 1: Basic Info */
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-slate-400 mb-8">Join iFLARE and start connecting</p>

          <div className="space-y-4 mb-8">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Full Name</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className="h-14 bg-slate-800/50 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Email</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="h-14 bg-slate-800/50 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Password</label>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                className="h-14 bg-slate-800/50 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="mt-auto">
            <Button
              onClick={handleNextStep}
              disabled={!formData.name || !formData.email || !formData.password}
              className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      ) : (
        /* Step 2: Interests Selection (One-time persona building) */
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold mb-2">What interests you?</h1>
          <p className="text-slate-400 mb-2">Select at least 3 interests to personalize your experience</p>
          <p className="text-orange-400 text-sm mb-6">✨ This builds your persona for better matches</p>

          {/* Interest chips */}
          <div className="flex flex-wrap gap-3 mb-8">
            {INTEREST_CATEGORIES.map((interest) => (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                className={`px-4 py-3 rounded-xl border transition-all duration-200 flex items-center gap-2 ${
                  selectedInterests.includes(interest.id)
                    ? `${interest.color} scale-105`
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="text-sm font-medium">{interest.label}</span>
                {selectedInterests.includes(interest.id) && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-auto">
            <p className="text-center text-slate-500 text-sm mb-4">
              {selectedInterests.length} of 3 minimum selected
            </p>
            <Button
              onClick={handleRegister}
              disabled={selectedInterests.length < 3 || isLoading}
              className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <>
                  Complete Registration
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-slate-600 text-xs mt-6">
        By signing up, you agree to our Terms & Privacy Policy
      </p>
    </main>
  )
}
