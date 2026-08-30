'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import StepProgress from '@/components/StepProgress'
import InterestChip from '@/components/InterestChip'
import InterestSelector from '@/components/InterestSelector'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'
import {
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  Search,
  MapPin,
  Users,
  AlertCircle,
} from 'lucide-react'
import { resolveInterest } from '@/lib/interests'
import { useInterestCatalog } from '@/lib/useInterestCatalog'
import { CAMPUS_LOCATIONS, LOCATION_GROUPS, toLocationValue } from '@/lib/campusLocations'

const STEPS = ['Details', 'When & where']
const PARTICIPANT_CHOICES = [2, 3, 4, 5, 6, 8, 10]

const IDEAS = [
  'Looking for gym buddy',
  'Going for cycling',
  'Slots for board game',
  'Tennis match needed',
  'Coffee & coding session',
  'Evening jog partner',
]

/** "Starting in ..." shortcuts; they set the date too, so crossing midnight works. */
const QUICK_OFFSETS = [
  { label: 'In 30 min', minutes: 30 },
  { label: 'In 1 hr', minutes: 60 },
  { label: 'In 2 hrs', minutes: 120 },
]

const pad = (n) => String(n).padStart(2, '0')

/**
 * Date/time values in the *browser's* timezone.
 *
 * The previous `todayISO()` used `toISOString()`, which is UTC: for a student
 * in IST between midnight and 05:30 it produced yesterday's date, so the date
 * input's `min` sat a day behind and "today" wasn't selectable. The quick
 * offsets below need local values for the same reason.
 */
const toDateValue = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const toTimeValue = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
const todayValue = () => toDateValue(new Date())
const dateValueIn = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toDateValue(d)
}

/**
 * Create-iFlare flow, previously a modal inside app/(app)/flares/page.js.
 *
 * Now an inline mode on the flares page (spec: a Join | Create switch rather
 * than a floating button), still two steps, still posting exactly the same
 * body to POST /api/flares.
 *
 * The venue picker replaced free-text entry plus a non-functional map
 * placeholder; it writes the same location shape, with lat/lng null.
 */
export default function CreateFlareForm({ currentUser, onCreated, onCancel }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    interests: [],
    location: toLocationValue(''),
    date: todayValue(),
    time: '',
    maxAttendees: 4,
  })
  const [ideasOpen, setIdeasOpen] = useState(false)
  const [interestsOpen, setInterestsOpen] = useState(false)
  const [locationQuery, setLocationQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Needed outside the popover too: the chips that stay on screen once it
  // closes have to resolve a custom interest's real name, not its slug.
  const { catalog } = useInterestCatalog(currentUser?.id)
  const selectedInterests = useMemo(
    () => formData.interests.map((id) => resolveInterest(id, catalog)),
    [formData.interests, catalog]
  )

  const visibleLocations = useMemo(() => {
    const q = locationQuery.trim().toLowerCase()
    if (!q) return null // grouped view
    return CAMPUS_LOCATIONS.filter(
      (l) => l.name.toLowerCase().includes(q) || l.group.toLowerCase().includes(q)
    )
  }, [locationQuery])

  const setInterests = (next) => {
    setError('')
    setFormData((prev) => ({ ...prev, interests: next }))
  }

  const removeInterest = (interest) =>
    setInterests(formData.interests.filter((id) => id !== interest.id))

  /** Quick offset: set date *and* time, rounded to the next 5 minutes. */
  const startIn = (minutes) => {
    const at = new Date(Date.now() + minutes * 60000)
    at.setMinutes(Math.ceil(at.getMinutes() / 5) * 5, 0, 0)
    setError('')
    setFormData((prev) => ({ ...prev, date: toDateValue(at), time: toTimeValue(at) }))
  }

  // Enter advances the step; the hook skips the description textarea and the
  // interest/venue chips.
  const detailsStepKeyDown = useEnterSubmit(() => handleContinue())
  const whenWhereStepKeyDown = useEnterSubmit(() => handleCreate())

  const step1Valid =
    formData.title.trim() && formData.description.trim() && formData.interests.length > 0
  const step2Valid = formData.location.name && formData.time

  const handleContinue = () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Add a title and a short description')
      return
    }
    if (formData.interests.length === 0) {
      setError('Pick at least one interest so the right people see this')
      return
    }
    setError('')
    setStep(2)
  }

  const handleCreate = async () => {
    if (!step2Valid) {
      setError('Pick a venue and a start time')
      return
    }

    const startTime = new Date(`${formData.date}T${formData.time}`)
    if (isNaN(startTime.getTime())) {
      setError('That start time doesn&apos;t look right')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('iflare_token')
      const response = await fetch('/api/flares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          interests: formData.interests,
          location: formData.location,
          startTime: startTime.toISOString(),
          maxAttendees: formData.maxAttendees,
          hostId: currentUser?.id,
          hostName: currentUser?.name,
        }),
      })

      if (response.ok) {
        const savedFlare = await response.json()
        onCreated(savedFlare)
        return
      }

      const data = await response.json().catch(() => ({}))
      setError(data.error || 'Failed to create iFlare')
      setIsSubmitting(false)
    } catch (err) {
      console.error('Error creating flare:', err)
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <StepProgress steps={STEPS} currentStep={step} />

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ---------------- Step 1: Details ---------------- */}
      {step === 1 && (
        <div onKeyDown={detailsStepKeyDown}>
          {/* Collapsed by default: six title suggestions are helpful once and
              then only push Continue below the fold on a phone. */}
          <Collapsible open={ideasOpen} onOpenChange={setIdeasOpen} className="mb-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-2.5 text-sm font-medium text-orange-400 transition-colors hover:bg-orange-500/15">
              <span>💡 Need an idea?</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${ideasOpen ? 'rotate-180' : ''}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-wrap gap-2 px-1 pt-3">
                {IDEAS.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, title: idea })
                      setIdeasOpen(false)
                    }}
                    className="rounded-lg bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-700/50"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-4">
            <div>
              <label htmlFor="flare-title" className="mb-2 block text-sm text-slate-400">
                What are you doing?
              </label>
              <Input
                id="flare-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Looking for a gym buddy"
                className="h-12 rounded-xl border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="flare-desc" className="mb-2 block text-sm text-slate-400">
                Tell people more
              </label>
              {/* Textarea: Enter inserts a newline, never submits. */}
              <Textarea
                id="flare-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Skill level, what to bring, how long you'll be there..."
                className="resize-y rounded-xl border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                How many people can join?
              </label>
              <div className="flex flex-wrap gap-2">
                {PARTICIPANT_CHOICES.map((n) => {
                  const selected = formData.maxAttendees === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFormData({ ...formData, maxAttendees: n })}
                      aria-pressed={selected}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${
                        selected
                          ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                          : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800/70'
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Users className="h-3 w-3" />
                Counting you — {formData.maxAttendees - 1} other
                {formData.maxAttendees - 1 === 1 ? '' : 's'} can join.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Who should see this?
              </label>

              {/* The picker lives in a popover so the step stays one screen
                  tall: the old always-visible grid of every interest pushed
                  Continue off the bottom on a phone. Same selector as the
                  register wizard, so custom interests work here too. */}
              <Popover open={interestsOpen} onOpenChange={setInterestsOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 px-4 text-sm text-slate-300 transition-colors hover:bg-slate-800/70"
                  >
                    <span className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-slate-500" />
                      {formData.interests.length
                        ? `${formData.interests.length} interest${
                            formData.interests.length === 1 ? '' : 's'
                          } selected`
                        : 'Choose interests'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-[min(22rem,calc(100vw-2rem))] rounded-xl border-slate-700 bg-slate-900 p-3"
                >
                  <InterestSelector
                    value={formData.interests}
                    onChange={setInterests}
                    userId={currentUser?.id}
                    // The chips stay visible under the trigger after this
                    // closes, so repeating them inside would just be noise.
                    showSelected={false}
                    suggestionLimit={12}
                    placeholder="Search or add an interest"
                  />
                </PopoverContent>
              </Popover>

              {selectedInterests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedInterests.map((interest) => (
                    <InterestChip
                      key={interest.id}
                      interest={interest}
                      size="sm"
                      onRemove={removeInterest}
                    />
                  ))}
                </div>
              )}

              <p className="mt-2 text-xs text-slate-500">
                Only students at your university will see this flare.
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-14 rounded-2xl border-slate-700 bg-transparent px-6 text-slate-300 hover:bg-slate-800/60 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!step1Valid}
              className="h-14 flex-1 rounded-2xl bg-orange-600 text-lg font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* ---------------- Step 2: When & where ---------------- */}
      {step === 2 && (
        <div onKeyDown={whenWhereStepKeyDown}>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-slate-400">When does it start?</label>

              {/* Time before date: a spontaneous meetup is decided as "in an
                  hour" or "at 9", and the day is almost always today — so the
                  field people actually have to think about comes first. */}
              <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  Time
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_OFFSETS.map((offset) => (
                    <button
                      key={offset.minutes}
                      type="button"
                      onClick={() => startIn(offset.minutes)}
                      className="rounded-full border border-slate-700 bg-slate-800/60 px-3.5 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:border-orange-500/60 hover:bg-orange-500/10 hover:text-orange-200"
                    >
                      {offset.label}
                    </button>
                  ))}
                </div>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  aria-label="Start time"
                  className="mt-3 h-12 w-full rounded-xl border-slate-700 bg-slate-900/60 text-white focus:border-orange-500"
                />
              </div>

              <div className="mt-3 rounded-xl border border-slate-700 bg-slate-800/40 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Date
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Today', value: todayValue() },
                    { label: 'Tomorrow', value: dateValueIn(1) },
                  ].map((choice) => {
                    const selected = formData.date === choice.value
                    return (
                      <button
                        key={choice.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, date: choice.value })}
                        aria-pressed={selected}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                          selected
                            ? 'border-orange-500/60 bg-orange-500/15 text-orange-200'
                            : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {choice.label}
                      </button>
                    )
                  })}
                </div>
                <Input
                  type="date"
                  value={formData.date}
                  min={todayValue()}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  aria-label="Start date"
                  className="mt-3 h-12 w-full rounded-xl border-slate-700 bg-slate-900/60 text-white focus:border-orange-500"
                />
              </div>

              {/* Make the consequence of the chosen time immediately legible. */}
              <StartTimePreview date={formData.date} time={formData.time} />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">Where?</label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="Search campus venues"
                  aria-label="Search campus venues"
                  className="h-11 rounded-xl border-slate-700 bg-slate-800/50 pl-9 text-white placeholder:text-slate-500 focus:border-orange-500"
                />
              </div>

              <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
                {visibleLocations ? (
                  <VenueList
                    venues={visibleLocations}
                    selectedName={formData.location.name}
                    onSelect={(venue) =>
                      setFormData({ ...formData, location: toLocationValue(venue) })
                    }
                  />
                ) : (
                  LOCATION_GROUPS.map((group) => (
                    <div key={group}>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                        {group}
                      </p>
                      <VenueList
                        venues={CAMPUS_LOCATIONS.filter((l) => l.group === group)}
                        selectedName={formData.location.name}
                        onSelect={(venue) =>
                          setFormData({ ...formData, location: toLocationValue(venue) })
                        }
                      />
                    </div>
                  ))
                )}

                {visibleLocations?.length === 0 && (
                  <p className="py-2 text-sm text-slate-500">
                    No venue matches &ldquo;{locationQuery}&rdquo;.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setError('')
                setStep(1)
              }}
              className="h-14 rounded-2xl border-slate-700 bg-transparent px-6 text-slate-300 hover:bg-slate-800/60 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={!step2Valid || isSubmitting}
              className="h-14 flex-1 rounded-2xl bg-orange-600 text-lg font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create iFlare'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function VenueList({ venues, selectedName, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {venues.map((venue) => {
        const selected = selectedName === venue.name
        return (
          <button
            key={venue.id}
            type="button"
            onClick={() => onSelect(venue)}
            aria-pressed={selected}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
              selected
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70'
            }`}
          >
            <span className="text-base">{venue.emoji}</span>
            <span
              className={`min-w-0 flex-1 truncate text-sm ${
                selected ? 'font-medium text-white' : 'text-slate-300'
              }`}
            >
              {venue.name}
            </span>
            {selected && <Check className="h-4 w-4 shrink-0 text-orange-400" />}
          </button>
        )
      })}
    </div>
  )
}

/** Restates the picked date/time as "starts in X" so mistakes are obvious. */
function StartTimePreview({ date, time }) {
  if (!date || !time) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
        <MapPin className="h-3 w-3 opacity-0" />
        Pick a time to see when this goes live.
      </p>
    )
  }

  const start = new Date(`${date}T${time}`)
  if (isNaN(start.getTime())) return null

  const diffMins = Math.round((start.getTime() - Date.now()) / 60000)

  let message
  let tone = 'text-slate-400'
  if (diffMins < 0) {
    message = 'That time has already passed.'
    tone = 'text-red-400'
  } else if (diffMins < 90) {
    message = `Starts in ${diffMins} min — it'll show on the feed straight away.`
    tone = 'text-orange-300'
  } else {
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    const rel = hours >= 24 ? `${Math.round(hours / 24)} day(s)` : `${hours}h ${mins}m`
    message = `Starts in ${rel} — it appears on the feed 90 minutes before.`
  }

  return (
    <p className={`mt-2 text-xs ${tone}`}>
      {start.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}
      {' · '}
      {message}
    </p>
  )
}
