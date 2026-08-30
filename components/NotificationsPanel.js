'use client'

import { Bell, BellOff, Check, Trash2 } from 'lucide-react'
import { useNotificationContext } from '@/lib/NotificationProvider'

/**
 * Renders the in-app notification history.
 *
 * This used to be a modal floating over the feed, reached through a
 * sessionStorage handoff from the sidebar. It's now the body of
 * app/(app)/notifications/page.js — a normal page like Activity or Profile.
 * The provider API is unchanged: it still consumes markAsRead / markAllAsRead /
 * clearAll exactly as exposed.
 */
export default function NotificationsPanel() {
  const {
    inAppNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    permission,
    requestPermission,
  } = useNotificationContext()

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      {/* Contextual permission nudge — shown here rather than as a banner
          pinned over the feed. */}
      {permission === 'default' && (
        <div className="border-b border-slate-800 bg-orange-500/10 px-5 py-3">
          <p className="text-sm text-orange-200">Get told when a flare matches you</p>
          <button
            onClick={requestPermission}
            className="mt-1.5 text-xs font-medium text-orange-400 hover:text-orange-300"
          >
            Turn on notifications
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <div className="flex items-start gap-2 border-b border-slate-800 px-5 py-3 text-xs text-slate-500">
          <BellOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Browser notifications are blocked. You can re-enable them in your
            browser&apos;s site settings.
          </span>
        </div>
      )}

      {inAppNotifications.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <p className="text-sm text-slate-400">Nothing yet</p>
          <p className="mt-1 text-xs text-slate-500">
            New flares matching your interests will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-800">
          {inAppNotifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => markAsRead(n.id)}
                className={`w-full px-5 py-3.5 text-left transition-colors hover:bg-slate-800/50 ${
                  n.read ? '' : 'bg-orange-500/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                  )}
                  <div className={`min-w-0 flex-1 ${n.read ? 'pl-5' : ''}`}>
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    {n.body && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{n.body}</p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-600">
                      {formatRelative(n.timestamp)}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {inAppNotifications.length > 0 && (
        <footer className="flex items-center gap-2 border-t border-slate-800 px-5 py-3">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </button>
          <button
            onClick={clearAll}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        </footer>
      )}
    </div>
  )
}

function formatRelative(timestamp) {
  const then = new Date(timestamp).getTime()
  if (isNaN(then)) return ''
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
