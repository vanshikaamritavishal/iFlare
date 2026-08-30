'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Loader2 } from 'lucide-react'

import NotificationsPanel from '@/components/NotificationsPanel'
import { useNotificationContext } from '@/lib/NotificationProvider'

/**
 * /notifications — the notification history as a normal authenticated page.
 *
 * Replaces the modal that used to float over the feed. Same shell, same session
 * guard and same loading treatment as the other authenticated pages; the list
 * itself is NotificationsPanel, reading the existing NotificationProvider.
 */
export default function NotificationsPage() {
  const router = useRouter()
  const { unreadCount } = useNotificationContext()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('iflare_user')
    const token = localStorage.getItem('iflare_token')
    if (!storedUser || !token) {
      router.push('/login')
      return
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <main>
      <header className="mb-5 flex items-center gap-2 py-2">
        <Bell className="h-6 w-6 text-orange-500" />
        <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
        {unreadCount > 0 && (
          <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </header>

      <NotificationsPanel />
    </main>
  )
}
