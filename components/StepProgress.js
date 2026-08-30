'use client'

import { Check } from 'lucide-react'

/**
 * Progress header for the multi-step flows (registration, flare creation).
 *
 * The requirement is that the user always knows where they are, how many steps
 * there are, and what's left — so this shows all three rather than a bare bar.
 * Labels collapse to a single "Step N of M · Label" line on narrow screens
 * where a full stepper would wrap badly.
 *
 * @param {string[]} steps        ordered step labels
 * @param {number}   currentStep  1-based index of the active step
 */
export default function StepProgress({ steps, currentStep }) {
  const total = steps.length
  const clamped = Math.min(Math.max(currentStep, 1), total)
  const percent = (clamped / total) * 100

  return (
    <div className="mb-8">
      {/* Compact summary — the only variant on narrow screens */}
      <div className="mb-3 flex items-baseline justify-between sm:hidden">
        <p className="text-sm font-medium text-white">{steps[clamped - 1]}</p>
        <p className="text-xs text-slate-500">
          Step {clamped} of {total}
        </p>
      </div>

      {/* Full stepper */}
      <ol className="mb-3 hidden items-center gap-1.5 sm:flex">
        {steps.map((label, i) => {
          const index = i + 1
          const isDone = index < clamped
          const isCurrent = index === clamped

          return (
            <li key={label} className="flex flex-1 items-center gap-1.5">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                  isDone
                    ? 'bg-orange-500 text-white'
                    : isCurrent
                      ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500'
                      : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isDone ? <Check className="h-3 w-3" /> : index}
              </span>
              <span
                className={`truncate text-xs transition-colors ${
                  isCurrent ? 'font-medium text-white' : 'text-slate-500'
                }`}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>

      <div
        className="h-1 w-full overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${clamped} of ${total}: ${steps[clamped - 1]}`}
      >
        <div
          className="h-full rounded-full bg-orange-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
