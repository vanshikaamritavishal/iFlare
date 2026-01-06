'use client'

import { NotificationProvider } from '@/lib/NotificationProvider'

export default function ClientProviders({ children }) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  )
}
