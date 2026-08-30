'use client'

import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The one chip used for every interest, built-in or custom.
 *
 * Deliberately ignores `INTERESTS[].color`: that per-id palette only ever
 * matched the twelve built-ins, so a user's own interest rendered grey next to
 * a green "Sports & Fitness" — the same concept in two visual languages. One
 * neutral resting state and one orange selected state means a custom interest
 * is indistinguishable from a built-in, which is the point.
 *
 * Three shapes, picked from the handlers passed in:
 *  - `onRemove`  → a chip with an X (a selected value you can take off)
 *  - `onSelect`  → a toggle button (a suggestion you can pick)
 *  - neither     → a static label (read-only display, e.g. on a flare card)
 *
 * `onRemove` renders a real button, so that shape is a <span> wrapper: a
 * button inside a button is invalid HTML and breaks the inner click target.
 */

const BASE =
  'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors'

const SIZES = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3.5 py-2 text-sm',
}

const SELECTED = 'border-orange-500/60 bg-orange-500/15 text-orange-200'
const RESTING = 'border-slate-700 bg-slate-800/40 text-slate-400'
const RESTING_INTERACTIVE =
  'hover:border-slate-600 hover:bg-slate-800/70 hover:text-slate-200'

export default function InterestChip({
  interest,
  selected = false,
  onSelect,
  onRemove,
  size = 'md',
  className,
}) {
  if (!interest?.id) return null

  const { emoji, name, id } = interest
  const label = (
    <>
      <span aria-hidden="true">{emoji}</span>
      <span>{name || id}</span>
    </>
  )
  const shell = cn(BASE, SIZES[size] || SIZES.md, className)

  if (onRemove) {
    return (
      <span className={cn(shell, SELECTED)}>
        {label}
        <button
          type="button"
          onClick={() => onRemove(interest)}
          aria-label={`Remove ${name || id}`}
          className="-mr-1 rounded-full p-0.5 text-orange-300/70 transition-colors hover:bg-orange-500/20 hover:text-orange-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    )
  }

  if (!onSelect) {
    return <span className={cn(shell, selected ? SELECTED : RESTING)}>{label}</span>
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(interest)}
      aria-pressed={selected}
      className={cn(
        shell,
        selected ? SELECTED : cn(RESTING, RESTING_INTERACTIVE)
      )}
    >
      {label}
      {selected && <Check className="h-3.5 w-3.5" />}
    </button>
  )
}
