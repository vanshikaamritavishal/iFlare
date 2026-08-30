'use client'

import { useCallback, useEffect, useState } from 'react'
import { INTERESTS, mergeInterests } from '@/lib/interests'

/**
 * The interest catalogue for the signed-in user's university: the built-in
 * list from lib/interests.js plus the custom interests students at their
 * email domain have created (see `GET /api/interests`).
 *
 * The fetched half is cached at module scope and shared through a subscriber
 * set rather than re-fetched per mount, because several components render
 * interests at once (the feed's cards, the search suggestions, a selector) and
 * the list is small, campus-wide and near-static. Creating an interest pushes
 * it into the same cache so every mounted consumer sees the new chip
 * immediately, without a refetch.
 */

let cachedCustom = null
let cachedForUser = null
let inflight = null
const subscribers = new Set()

function publish(custom) {
  cachedCustom = custom
  subscribers.forEach((fn) => fn(custom))
}

/** Make a newly created interest visible everywhere, without a refetch. */
export function addCustomInterest(interest) {
  if (!interest?.id) return
  const current = cachedCustom || []
  if (current.some((i) => i.id === interest.id)) return
  publish([...current, interest])
}

async function fetchCustom(userId) {
  const res = await fetch(`/api/interests?userId=${encodeURIComponent(userId)}`)
  if (!res.ok) throw new Error('Failed to load interests')
  const data = await res.json()
  return Array.isArray(data.interests) ? data.interests : []
}

export function useInterestCatalog(userId) {
  const [custom, setCustom] = useState(cachedCustom || [])
  const [loading, setLoading] = useState(!cachedCustom && !!userId)

  useEffect(() => {
    subscribers.add(setCustom)
    return () => subscribers.delete(setCustom)
  }, [])

  useEffect(() => {
    if (!userId) return
    // A different account in the same tab (logout → login) must not inherit
    // the previous campus's custom interests.
    if (cachedForUser === userId && cachedCustom) {
      setCustom(cachedCustom)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    if (cachedForUser !== userId) {
      inflight = null
      cachedCustom = null
    }
    cachedForUser = userId
    inflight = inflight || fetchCustom(userId)

    inflight
      .then((list) => {
        if (cancelled) return
        publish(list)
      })
      // A failed fetch is not fatal — the built-in list still works, the user
      // just won't see their campus's custom interests suggested.
      .catch(() => {
        if (!cancelled) publish([])
      })
      .finally(() => {
        inflight = null
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const refresh = useCallback(async () => {
    if (!userId) return
    inflight = null
    try {
      publish(await fetchCustom(userId))
    } catch {
      /* keep whatever is cached */
    }
  }, [userId])

  return {
    catalog: custom.length ? mergeInterests(custom) : INTERESTS,
    custom,
    loading,
    refresh,
  }
}

export default useInterestCatalog
