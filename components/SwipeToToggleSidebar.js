'use client'

import { useEffect } from 'react'
import { useSidebar } from '@/components/ui/sidebar'

/**
 * Swipe right (anywhere) opens the sidebar; swipe left closes it.
 *
 * Mounted inside AppShell, mobile only — on desktop the sidebar is always
 * visible, so there is nothing to reveal.
 *
 * The whole point of the thresholds below is that a gesture meant for
 * something else must never be stolen:
 *  - the gesture is abandoned the moment vertical movement dominates, so
 *    scrolling the feed is untouched;
 *  - it never starts inside a text field or a horizontally scrollable region
 *    (the interest chip rows, the venue grid), which own their own gestures;
 *  - it requires a decisive, fast, mostly-horizontal drag, so a tap or a lazy
 *    scroll can't trip it.
 *
 * Listeners are passive and we never call preventDefault(), so native
 * scrolling and touch behaviour are left exactly as they were.
 */

const MIN_DISTANCE = 60 // px of horizontal travel before we call it a swipe
const MAX_DURATION = 600 // ms — a slow drag is probably not a nav gesture
const HORIZONTAL_DOMINANCE = 2 // |dx| must be at least 2x |dy|
const VERTICAL_ABANDON = 12 // px of vertical drift that cancels the gesture

/** True when the gesture belongs to something else on the page. */
function shouldIgnoreTarget(target) {
  let node = target instanceof Element ? target : null

  while (node && node !== document.body) {
    const tag = node.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
    if (node.isContentEditable) return true
    if (node.dataset && node.dataset.noSwipe !== undefined) return true

    // A horizontally scrollable ancestor gets to keep its own left/right drag.
    if (node.scrollWidth > node.clientWidth) {
      const overflowX = window.getComputedStyle(node).overflowX
      if (overflowX === 'auto' || overflowX === 'scroll') return true
    }

    node = node.parentElement
  }

  return false
}

export default function SwipeToToggleSidebar() {
  const { isMobile, openMobile, setOpenMobile } = useSidebar()

  useEffect(() => {
    if (!isMobile) return

    let gesture = null

    const onTouchStart = (event) => {
      // Multi-touch is a pinch/zoom, not a nav swipe.
      if (event.touches.length !== 1 || shouldIgnoreTarget(event.target)) {
        gesture = null
        return
      }
      const touch = event.touches[0]
      gesture = { x: touch.clientX, y: touch.clientY, at: Date.now(), cancelled: false }
    }

    const onTouchMove = (event) => {
      if (!gesture || gesture.cancelled) return
      const touch = event.touches[0]
      const dx = touch.clientX - gesture.x
      const dy = touch.clientY - gesture.y
      if (Math.abs(dy) > VERTICAL_ABANDON && Math.abs(dy) > Math.abs(dx)) {
        gesture.cancelled = true // they're scrolling — stay out of the way
      }
    }

    const onTouchEnd = (event) => {
      const started = gesture
      gesture = null
      if (!started || started.cancelled) return

      const touch = event.changedTouches[0]
      const dx = touch.clientX - started.x
      const dy = touch.clientY - started.y

      if (Date.now() - started.at > MAX_DURATION) return
      if (Math.abs(dx) < MIN_DISTANCE) return
      if (Math.abs(dx) < HORIZONTAL_DOMINANCE * Math.abs(dy)) return

      if (dx > 0 && !openMobile) setOpenMobile(true)
      else if (dx < 0 && openMobile) setOpenMobile(false)
    }

    const onTouchCancel = () => {
      gesture = null
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    document.addEventListener('touchcancel', onTouchCancel, { passive: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [isMobile, openMobile, setOpenMobile])

  return null
}
