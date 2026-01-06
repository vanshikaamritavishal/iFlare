import './globals.css'
import { NotificationProvider } from '@/lib/NotificationProvider'

export const metadata = {
  title: 'iFLARE - Real connections. Right now.',
  description: 'iFLARE - Find real connections happening around you, right now.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  )
}
