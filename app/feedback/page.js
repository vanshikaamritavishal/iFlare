'use client'

import { useState } from 'react'
import { Bug, Lightbulb, MessageSquareHeart, Send } from 'lucide-react'

import InfoPageShell, { InfoSection } from '@/components/InfoPageShell'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CONTACT_EMAIL, hasContactEmail } from '@/lib/site'

const CATEGORIES = [
  { id: 'idea', label: 'An idea', icon: Lightbulb },
  { id: 'bug', label: 'Something broken', icon: Bug },
  { id: 'other', label: 'Something else', icon: MessageSquareHeart },
]

export default function FeedbackPage() {
  const [category, setCategory] = useState('idea')
  const [message, setMessage] = useState('')

  const canSend = hasContactEmail && message.trim().length > 0

  // There's no feedback endpoint on the API, so rather than invent one this
  // hands off to the user's mail client with the message pre-filled.
  const handleSend = () => {
    if (!canSend) return
    const label = CATEGORIES.find((c) => c.id === category)?.label ?? 'Feedback'
    const subject = `iFLARE feedback — ${label}`
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(message.trim())}`
  }

  return (
    <InfoPageShell
      title="Feedback"
      subtitle="Tell us what's working, what isn't, and what's missing."
    >
      <InfoSection heading="What's this about?">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const selected = category === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                aria-pressed={selected}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                    : 'border-slate-700 bg-slate-900/40 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            )
          })}
        </div>
      </InfoSection>

      <InfoSection heading="Your message">
        {/* Deliberately no Enter-to-submit here: this is a multiline field, so
            Enter must insert a newline. */}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="What happened, or what would you like to see? The more specific, the more useful."
          className="resize-y border-slate-700 bg-slate-900/60 text-white placeholder:text-slate-500"
        />

        {hasContactEmail ? (
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="h-11 w-full bg-orange-600 font-medium text-white hover:bg-orange-700"
          >
            <Send className="mr-2 h-4 w-4" />
            Send feedback
          </Button>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3.5">
            <p className="text-sm text-slate-300">
              The feedback inbox isn&apos;t set up yet.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              iFLARE is an early-stage student project — this form will be
              connected before launch.
            </p>
          </div>
        )}
      </InfoSection>

      <p className="text-xs text-slate-500">
        This opens your email app with the message ready to send, so you&apos;ll
        always see exactly what gets sent.
      </p>
    </InfoPageShell>
  )
}
