/**
 * Single source of truth for interest categories.
 *
 * These ids are persisted on users.interests[] and flares.interests[], so they
 * must not be renamed without a data migration. The list previously existed as
 * four near-identical copies (register, profile, flares, activity) that had
 * already drifted apart in wording — this consolidates them.
 */
export const INTERESTS = [
  { id: 'sports', emoji: '🏃', name: 'Sports & Fitness', color: 'bg-green-500/20 border-green-500/50 text-green-400', tag: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { id: 'music', emoji: '🎵', name: 'Music & Concerts', color: 'bg-purple-500/20 border-purple-500/50 text-purple-400', tag: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'food', emoji: '🍕', name: 'Food & Dining', color: 'bg-orange-500/20 border-orange-500/50 text-orange-400', tag: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { id: 'art', emoji: '🎨', name: 'Art & Culture', color: 'bg-pink-500/20 border-pink-500/50 text-pink-400', tag: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { id: 'tech', emoji: '💻', name: 'Tech & Gaming', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400', tag: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'outdoor', emoji: '🏕️', name: 'Outdoor & Adventure', color: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400', tag: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'nightlife', emoji: '🌙', name: 'Nightlife & Parties', color: 'bg-violet-500/20 border-violet-500/50 text-violet-400', tag: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  { id: 'wellness', emoji: '🧘', name: 'Wellness & Mindfulness', color: 'bg-teal-500/20 border-teal-500/50 text-teal-400', tag: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  { id: 'learning', emoji: '📚', name: 'Learning & Workshops', color: 'bg-amber-500/20 border-amber-500/50 text-amber-400', tag: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'social', emoji: '☕', name: 'Casual Hangouts', color: 'bg-rose-500/20 border-rose-500/50 text-rose-400', tag: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  { id: 'pets', emoji: '🐕', name: 'Pets & Animals', color: 'bg-lime-500/20 border-lime-500/50 text-lime-400', tag: 'bg-lime-500/20 text-lime-400 border-lime-500/30' },
  { id: 'travel', emoji: '✈️', name: 'Travel & Exploration', color: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400', tag: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
]

export const INTEREST_MAP = INTERESTS.reduce((acc, i) => {
  acc[i.id] = i
  return acc
}, {})

/** Emoji shown for a custom interest, which has none of its own. */
export const DEFAULT_INTEREST_EMOJI = '✨'

/** Upper bound for a user-created interest name, enforced on both ends. */
export const INTEREST_NAME_MAX_LENGTH = 40

export const interestEmoji = (id) => INTEREST_MAP[id]?.emoji ?? DEFAULT_INTEREST_EMOJI
export const interestName = (id) => INTEREST_MAP[id]?.name ?? id
export const interestLabel = (id) =>
  INTEREST_MAP[id] ? `${INTEREST_MAP[id].emoji} ${INTEREST_MAP[id].name}` : id

/**
 * Turn a free-text interest name into the id that gets persisted.
 *
 * Shared by the client (optimistic chip) and the API (`POST /interests`) so
 * both agree on the id for a given name — that agreement is what makes the
 * upsert idempotent and stops "Board Games" and "board games" becoming two
 * interests on the same campus.
 */
export function slugifyInterest(name) {
  return String(name ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, INTEREST_NAME_MAX_LENGTH)
    .replace(/-+$/g, '')
}

/**
 * The built-in list plus this university's custom interests.
 *
 * Built-ins always win a id collision: they're shared by every campus and
 * their ids are already persisted on existing users/flares.
 */
export function mergeInterests(custom = []) {
  const extras = custom
    .filter((i) => i?.id && !INTEREST_MAP[i.id])
    .map((i) => ({
      id: i.id,
      name: i.name || titleCase(i.id),
      emoji: i.emoji || DEFAULT_INTEREST_EMOJI,
      custom: true,
    }))
  return [...INTERESTS, ...extras]
}

/**
 * Look an id up in a catalogue, falling back to a readable shape.
 *
 * The fallback matters: `users.interests[]`/`flares.interests[]` hold bare
 * ids, so a chip may be asked to render an interest from another campus (or
 * one the catalogue fetch hasn't returned yet) — better a de-slugified name
 * than a raw `board-games`.
 */
export function resolveInterest(id, catalog = INTERESTS) {
  return (
    catalog.find((i) => i.id === id) || {
      id,
      name: titleCase(id),
      emoji: DEFAULT_INTEREST_EMOJI,
      custom: true,
    }
  )
}

export function searchInterests(query, catalog = INTERESTS) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return catalog
  return catalog.filter(
    (i) => i.name.toLowerCase().includes(q) || i.id.includes(q)
  )
}

function titleCase(id) {
  return String(id ?? '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
