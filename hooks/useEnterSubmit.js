'use client'

import { useCallback } from 'react'

/**
 * Returns an onKeyDown handler that fires a primary action on Enter.
 *
 * Spread it on the wrapper around a step whose primary button is an onClick
 * handler rather than a native form submit. Pages built on a real
 * <form onSubmit> already get Enter for free and don't need this.
 *
 * Two deliberate exclusions:
 *  - TEXTAREA — Enter must insert a newline in a bio or a flare description.
 *  - BUTTON   — Enter on a focused interest chip must toggle that chip, not
 *               skip the user past the step they're filling in.
 *
 * @param {Function} onSubmit           invoked when Enter is pressed
 * @param {Object}   [options]
 * @param {boolean}  [options.disabled] when true, Enter does nothing
 */
export function useEnterSubmit(onSubmit, { disabled = false } = {}) {
  return useCallback(
    (event) => {
      if (event.key !== 'Enter' || event.shiftKey) return
      // Enter also commits an IME candidate (e.g. transliterated Hindi input),
      // which must not double as a submit.
      if (event.nativeEvent?.isComposing) return

      const tag = event.target?.tagName
      if (tag === 'TEXTAREA' || tag === 'BUTTON') return
      if (disabled) return

      event.preventDefault()
      onSubmit?.()
    },
    [onSubmit, disabled]
  )
}

export default useEnterSubmit
