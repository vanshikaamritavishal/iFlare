'use client'

import { useMemo, useState } from 'react'
import { Loader2, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import InterestChip from '@/components/InterestChip'
import { addCustomInterest, useInterestCatalog } from '@/lib/useInterestCatalog'
import {
  INTEREST_NAME_MAX_LENGTH,
  resolveInterest,
  searchInterests,
  slugifyInterest,
} from '@/lib/interests'

/**
 * The one interest picker: search, suggestions, selected chips, and — when a
 * signed-in `userId` is supplied — creating an interest that doesn't exist yet.
 *
 * Replaces the always-visible 12-chip grids that had been copy-pasted into the
 * register wizard, the profile page and the create-flare form, each with its
 * own styling and none of which could accept an interest the fixed list
 * doesn't know about.
 *
 * `value` is an array of interest **ids** and that's exactly what is persisted
 * (`users.interests[]` / `flares.interests[]`) — a custom interest is only a
 * catalogue row, never a different storage shape.
 *
 * @param {string[]} value        selected interest ids
 * @param {Function} onChange     receives the next id array
 * @param {string}   [userId]     signed-in user; required to create interests
 * @param {number}   [min]        shown as a "n more to go" hint; not enforced here
 * @param {number}   [max]        hard cap on selections
 * @param {boolean}  [allowCustom]
 * @param {boolean}  [showSelected] render the selected chips above the input;
 *   turn it off where the host already shows them (e.g. the create-flare
 *   popover, whose chips must stay visible after the popover closes)
 */
export default function InterestSelector({
  value = [],
  onChange,
  userId,
  min,
  max,
  allowCustom = true,
  showSelected = true,
  placeholder = 'Search or add an interest',
  // Comfortably above the 12 built-ins: a lower cap would spend the whole
  // list on them and truncate every custom interest the campus has added,
  // making them undiscoverable to anyone who doesn't already know the name.
  suggestionLimit = 24,
  autoFocus = false,
  className = '',
}) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const { catalog, loading } = useInterestCatalog(userId)

  const canCreate = allowCustom && !!userId
  const atMax = !!max && value.length >= max

  const selected = useMemo(
    () => value.map((id) => resolveInterest(id, catalog)),
    [value, catalog]
  )

  const suggestions = useMemo(
    () =>
      searchInterests(query, catalog)
        .filter((i) => !value.includes(i.id))
        .slice(0, suggestionLimit),
    [query, catalog, value, suggestionLimit]
  )

  const trimmedQuery = query.trim().replace(/\s+/g, ' ')
  const querySlug = slugifyInterest(trimmedQuery)
  // Offer "add" only for something genuinely new — an exact hit on an existing
  // interest is a pick, and the suggestion for it is already on screen.
  const showCreate =
    canCreate &&
    !!querySlug &&
    !catalog.some((i) => i.id === querySlug) &&
    !value.includes(querySlug)

  const add = (interest) => {
    if (!interest?.id || value.includes(interest.id)) return
    if (atMax) {
      setError(`You can pick up to ${max}.`)
      return
    }
    setError('')
    setQuery('')
    onChange?.([...value, interest.id])
  }

  const remove = (interest) => {
    setError('')
    onChange?.(value.filter((id) => id !== interest.id))
  }

  const commitQuery = async () => {
    if (!trimmedQuery) return

    const existing = catalog.find(
      (i) =>
        i.id === querySlug || i.name.toLowerCase() === trimmedQuery.toLowerCase()
    )
    if (existing) {
      add(existing)
      return
    }

    if (!canCreate) {
      setError('Pick one of the suggestions above.')
      return
    }
    if (atMax) {
      setError(`You can pick up to ${max}.`)
      return
    }
    if (trimmedQuery.length < 2) {
      setError('That interest name is too short.')
      return
    }
    if (trimmedQuery.length > INTEREST_NAME_MAX_LENGTH) {
      setError(`Keep it under ${INTEREST_NAME_MAX_LENGTH} characters.`)
      return
    }

    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: trimmedQuery }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not add that interest')
      // Push it into the shared catalogue first so the chip renders with its
      // real name rather than the de-slugified fallback.
      addCustomInterest(data.interest)
      add(data.interest)
    } catch (e) {
      setError(e.message || 'Could not add that interest')
    } finally {
      setCreating(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.nativeEvent?.isComposing) return

    if (event.key === 'Enter') {
      // This input lives inside wizard steps wired to useEnterSubmit and, in
      // other places, inside a real <form>. Enter here means "add this
      // interest" and must never advance the step or submit the form.
      event.preventDefault()
      event.stopPropagation()
      commitQuery()
      return
    }

    // Familiar token-input behaviour: backspace on an empty field takes the
    // last chip off, so correcting a mis-tap doesn't need the mouse.
    if (event.key === 'Backspace' && !query && value.length) {
      event.preventDefault()
      remove({ id: value[value.length - 1] })
    }
  }

  const remaining = min ? min - value.length : 0

  return (
    <div className={className}>
      {showSelected && selected.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selected.map((interest) => (
            <InterestChip
              key={interest.id}
              interest={interest}
              onRemove={remove}
            />
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setError('')
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search or add an interest"
          autoFocus={autoFocus}
          maxLength={INTEREST_NAME_MAX_LENGTH}
          className="h-11 rounded-xl border-slate-700 bg-slate-800/50 pl-9 text-white placeholder:text-slate-500 focus:border-orange-500"
        />
        {creating && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" />
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {showCreate && (
          <button
            type="button"
            onClick={commitQuery}
            disabled={creating}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-orange-500/50 px-3.5 py-2 text-sm font-medium text-orange-300 transition-colors hover:bg-orange-500/10 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add &ldquo;{trimmedQuery}&rdquo;
          </button>
        )}

        {suggestions.map((interest) => (
          <InterestChip
            key={interest.id}
            interest={interest}
            onSelect={add}
          />
        ))}

        {!showCreate && suggestions.length === 0 && !loading && (
          <p className="py-1 text-sm text-slate-500">
            {trimmedQuery
              ? `No interest matches “${trimmedQuery}”.`
              : 'Everything is already selected.'}
          </p>
        )}
      </div>

      {min > 0 && (
        <p className="mt-3 text-sm text-slate-500">
          {value.length} selected
          {remaining > 0 && ` · ${remaining} more to go`}
        </p>
      )}
    </div>
  )
}
