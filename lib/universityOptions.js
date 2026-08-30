import { INDIAN_UNIVERSITY_DOMAINS, getDomainFromEmail } from '@/lib/universities'

/**
 * Presentation-layer view of the university whitelist.
 *
 * lib/universities.js is keyed by domain and intentionally has several domains
 * pointing at the same institution (iitkgp.ac.in and kgpian.iitkgp.ac.in are
 * both IIT Kharagpur). A picker needs the inverse: one entry per university,
 * carrying every domain that resolves to it.
 *
 * This file derives that view; it does not change the source of truth.
 */
export const UNIVERSITY_OPTIONS = Object.entries(INDIAN_UNIVERSITY_DOMAINS)
  .reduce((acc, [domain, name]) => {
    const existing = acc.find((u) => u.name === name)
    if (existing) {
      existing.domains.push(domain)
    } else {
      acc.push({ name, domains: [domain] })
    }
    return acc
  }, [])
  .sort((a, b) => a.name.localeCompare(b.name))

/**
 * Sentinel for "my university isn't in the list". It's a real case, not an
 * error state: resolveUniversity() accepts any .ac.in / .edu.in address, so a
 * student at an unlisted institution can still sign up — we just can't
 * pre-fill their domain.
 */
export const OTHER_UNIVERSITY = { name: 'My university isn\'t listed', other: true }

export function searchUniversities(query) {
  const q = query.trim().toLowerCase()
  if (!q) return UNIVERSITY_OPTIONS
  return UNIVERSITY_OPTIONS.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.domains.some((d) => d.includes(q))
  )
}

/**
 * True when `email` belongs to the university the user picked earlier.
 * Unlisted-university selections can't be checked this way, so they pass.
 */
export function emailMatchesUniversity(email, university) {
  if (!university || university.other) return true
  const domain = getDomainFromEmail(email)
  if (!domain) return false
  return university.domains.some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  )
}
