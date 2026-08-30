'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, MapPin, Clock, User, Users, Check, Plus, Timer } from 'lucide-react'
import FlareChat from '@/components/FlareChat'
import { INTEREST_MAP, interestLabel } from '@/lib/interests'

/**
 * Summary / details view for a single flare, used by both the feed and the
 * Activity page (which hands a flare over via sessionStorage).
 *
 * Redesign notes: the title now leads instead of sitting below a fake map, the
 * map placeholder is gone entirely, and the headline facts (time remaining,
 * spots filled, venue) are surfaced as a stat row so they're readable at a
 * glance. Join stays the single strongest action on the sheet.
 *
 * Chat behaviour is deliberately unchanged — same component, same access rule
 * (host or attendee, and only while the flare hasn't ended).
 */
export default function FlareDetailModal({
  flare,
  onClose,
  onJoin,
  currentUser,
  timeInfo,
  getUrgencyStyles,
}) {
  const isAttending = flare.attendees.some((a) => a.id === currentUser.id)
  const isFull = flare.attendees.length >= flare.maxAttendees - 1 // -1 because host counts
  const isHost = flare.host.id === currentUser.id
  const spotsTaken = flare.attendees.length + 1
  const openSpots = Math.max(flare.maxAttendees - spotsTaken, 0)

  const panelRef = useRef(null)

  // Escape closes the sheet — expected of any modal, and the only way out on
  // desktop without hunting for the X.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const startDate = new Date(flare.startTime)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={flare.title}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={panelRef}
        className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-slate-900 sm:rounded-3xl"
      >
        {/* Title block — leads the sheet */}
        <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-6 pb-4 pt-6 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {flare.interests.map((interest) => (
                  <span
                    key={interest}
                    className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                      INTEREST_MAP[interest]?.tag ?? 'border-slate-600 text-slate-400'
                    }`}
                  >
                    {interestLabel(interest)}
                  </span>
                ))}
              </div>
              <h2 className="text-2xl font-bold leading-tight">{flare.title}</h2>
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-colors hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 pt-5">
          {/* Headline facts */}
          <div className="mb-5 grid grid-cols-3 gap-2">
            <div
              className={`rounded-xl border px-3 py-2.5 text-center ${getUrgencyStyles(
                timeInfo.urgency
              )}`}
            >
              <Timer className="mx-auto mb-1 h-4 w-4" />
              <p className="text-xs font-bold leading-tight">
                {timeInfo.urgency === 'happening'
                  ? timeInfo.text
                  : timeInfo.urgency === 'ended'
                    ? 'Ended'
                    : `in ${timeInfo.text}`}
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-center">
              <Users className="mx-auto mb-1 h-4 w-4 text-orange-400" />
              <p className="text-xs font-bold leading-tight text-white">
                {spotsTaken}/{flare.maxAttendees}
              </p>
              <p className="text-[10px] text-slate-500">joined</p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-center">
              <Clock className="mx-auto mb-1 h-4 w-4 text-orange-400" />
              <p className="text-xs font-bold leading-tight text-white">
                {startDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-[10px] text-slate-500">
                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          <p className="mb-5 text-slate-400">{flare.description}</p>

          {/* Venue + host */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/40 p-3">
              <MapPin className="h-5 w-5 shrink-0 text-orange-400" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Venue</p>
                <p className="truncate text-sm font-medium">
                  {flare.location?.name || 'To be decided'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/40 p-3">
              <User className="h-5 w-5 shrink-0 text-orange-400" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Host</p>
                <p className="truncate text-sm font-medium">{flare.host.name}</p>
              </div>
            </div>
          </div>

          {/* Attendees */}
          <div className="mb-6">
            <h3 className="mb-3 font-semibold">
              Who&apos;s going ({spotsTaken}/{flare.maxAttendees})
            </h3>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold">
                  {flare.host.name.charAt(0)}
                </div>
                <span className="text-sm">{flare.host.name}</span>
                <span className="text-xs text-orange-400">Host</span>
              </div>

              {flare.attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-600 text-xs font-bold">
                    {attendee.name.charAt(0)}
                  </div>
                  <span className="text-sm">{attendee.name}</span>
                </div>
              ))}

              {Array.from({ length: openSpots }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-800/50 px-3 py-2"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700">
                    <Plus className="h-3 w-3 text-slate-500" />
                  </div>
                  <span className="text-sm text-slate-500">Open spot</span>
                </div>
              ))}
            </div>
          </div>

          {/* Primary action — join is the strongest CTA on this sheet */}
          {timeInfo.urgency === 'ended' ? (
            <div className="flex h-14 w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/40 font-medium text-slate-400">
              This iFlare has ended
            </div>
          ) : isHost ? (
            <Button
              className="h-14 w-full rounded-2xl bg-slate-700 text-lg font-semibold text-white"
              disabled
            >
              You&apos;re hosting this iFlare
            </Button>
          ) : isAttending ? (
            <Button
              className="h-14 w-full rounded-2xl bg-green-600 text-lg font-semibold text-white"
              disabled
            >
              <Check className="mr-2 h-5 w-5" />
              You&apos;re going!
            </Button>
          ) : isFull ? (
            <Button
              className="h-14 w-full rounded-2xl bg-slate-700 text-lg font-semibold text-white"
              disabled
            >
              This iFlare is full
            </Button>
          ) : (
            <Button
              onClick={onJoin}
              autoFocus
              className={`h-16 w-full rounded-2xl text-lg font-bold text-white ${
                timeInfo.urgency === 'critical'
                  ? 'animate-pulse bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {timeInfo.urgency === 'critical' ? '🔥 Join now' : 'Join iFlare'}
            </Button>
          )}

          {/* Chat — only for participants and only while the flare is live */}
          {(isHost || isAttending) && timeInfo.urgency !== 'ended' && (
            <FlareChat flareId={flare.id} currentUser={currentUser} />
          )}
        </div>
      </div>
    </div>
  )
}
