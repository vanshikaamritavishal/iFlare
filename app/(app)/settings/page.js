'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, BellOff, BellRing, ChevronRight, LogOut, User, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useNotificationContext } from '@/lib/NotificationProvider'

export default function SettingsPage() {
  const router = useRouter()
  const { permission, requestPermission, clearAll, inAppNotifications } =
    useNotificationContext()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('iflare_user')
    const token = localStorage.getItem('iflare_token')
    if (!storedUser || !token) {
      router.push('/login')
      return
    }
    try {
      setUser(JSON.parse(storedUser))
    } catch (e) {
      console.error('Error parsing user data')
    }
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('iflare_user')
    localStorage.removeItem('iflare_token')
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <main>
      <header className="py-2">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <div className="space-y-8 py-6">
        {/* Notifications */}
        <section>
          <h2 className="mb-2 text-lg font-semibold">Notifications</h2>
          <p className="mb-4 text-sm text-slate-400">
            Get told when a flare matching your interests appears.
          </p>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-start gap-3">
              {permission === 'granted' ? (
                <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
              ) : permission === 'denied' ? (
                <BellOff className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              ) : (
                <Bell className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
              )}

              <div className="min-w-0 flex-1">
                {permission === 'granted' && (
                  <>
                    <p className="text-sm font-medium text-white">Notifications are on</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Turn them off in your browser&apos;s site settings.
                    </p>
                  </>
                )}

                {permission === 'denied' && (
                  <>
                    <p className="text-sm font-medium text-white">Notifications are blocked</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Your browser is blocking them. Re-enable them in its site
                      settings for this page, then reload.
                    </p>
                  </>
                )}

                {permission === 'default' && (
                  <>
                    <p className="text-sm font-medium text-white">Notifications are off</p>
                    <p className="mt-1 text-xs text-slate-500">
                      We&apos;ll only use them for flares that match your interests.
                    </p>
                    <Button
                      onClick={requestPermission}
                      className="mt-3 h-10 bg-orange-600 text-sm font-medium text-white hover:bg-orange-700"
                    >
                      Turn on notifications
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {inAppNotifications.length > 0 && (
            <button
              onClick={clearAll}
              className="mt-3 text-sm text-slate-400 transition-colors hover:text-red-400"
            >
              Clear notification history ({inAppNotifications.length})
            </button>
          )}
        </section>

        {/* Account */}
        <section>
          <h2 className="mb-2 text-lg font-semibold">Account</h2>
          <p className="mb-4 text-sm text-slate-400">
            {user?.email}
          </p>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
            <Link
              href="/profile"
              className="flex items-center gap-3 border-b border-slate-800 px-4 py-3.5 transition-colors hover:bg-slate-800/50"
            >
              <User className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="flex-1 text-sm text-slate-200">
                Edit profile, bio and interests
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-800/50"
            >
              <LogOut className="h-4 w-4 shrink-0 text-red-400" />
              <span className="flex-1 text-sm text-red-400">Log out</span>
            </button>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">About</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
            {[
              { href: '/about', label: 'About iFLARE' },
              { href: '/feedback', label: 'Send feedback' },
              { href: '/contact', label: 'Contact' },
              { href: '/privacy', label: 'Privacy Policy' },
              { href: '/terms', label: 'Terms & Conditions' },
            ].map((item, i, arr) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-800/50 ${
                  i < arr.length - 1 ? 'border-b border-slate-800' : ''
                }`}
              >
                <span className="flex-1 text-sm text-slate-200">{item.label}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
