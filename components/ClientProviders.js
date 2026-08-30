'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { NotificationProvider } from '@/lib/NotificationProvider'

export default function ClientProviders({ children }) {
  return (
    // iFLARE is dark-only for now; enableSystem is off so the OS setting can't
    // flip us into an untested light theme. The provider still gives us the
    // `dark` class the shadcn tokens key off, and a toggle can be added later.
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <NotificationProvider>
        {children}
        <Toaster position="top-center" richColors />
      </NotificationProvider>
    </ThemeProvider>
  )
}
