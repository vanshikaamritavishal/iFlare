import AppShell from '@/components/AppShell'

/**
 * Shell for the authenticated app (/flares, /activity, /profile, ...).
 *
 * This is a route group, so it adds chrome without changing any URL. The chrome
 * itself lives in components/AppShell.js because the public info pages need to
 * render it too when the visitor happens to be signed in.
 */
export default function AppLayout({ children }) {
  return <AppShell>{children}</AppShell>
}
