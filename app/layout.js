import './globals.css'
import ClientProviders from '@/components/ClientProviders'

export const metadata = {
  title: 'iFLARE - Real connections. Right now.',
  description: 'iFLARE - Find real connections happening around you, right now.',
}

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning is required by next-themes, which sets the
    // theme class on <html> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
