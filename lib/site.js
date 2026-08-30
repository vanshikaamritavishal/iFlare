/**
 * Site-level contact details used by the public info pages.
 *
 * SET THIS before launch. It is intentionally empty rather than a made-up
 * address — the Contact and Feedback pages detect the empty value and show an
 * honest "not set up yet" state instead of rendering a mailto: link that
 * silently goes nowhere.
 */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || ''

export const hasContactEmail = Boolean(CONTACT_EMAIL)

export function mailtoLink(subject) {
  if (!hasContactEmail) return null
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : ''
  return `mailto:${CONTACT_EMAIL}${query}`
}
