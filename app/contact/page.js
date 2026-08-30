import Link from 'next/link'
import { Mail, MessageSquareHeart } from 'lucide-react'

import InfoPageShell, { InfoSection } from '@/components/InfoPageShell'
import { CONTACT_EMAIL, hasContactEmail, mailtoLink } from '@/lib/site'

export const metadata = {
  title: 'Contact · iFLARE',
  description: 'How to get in touch with the iFLARE team.',
}

export default function ContactPage() {
  const mailto = mailtoLink('iFLARE — Contact')

  return (
    <InfoPageShell
      title="Contact"
      subtitle="Questions, issues, or anything about your account."
    >
      <InfoSection>
        {hasContactEmail ? (
          <a
            href={mailto}
            className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3.5 transition-colors hover:border-slate-700 hover:bg-slate-900/70"
          >
            <Mail className="h-4 w-4 shrink-0 text-orange-500" />
            <span className="text-sm text-slate-200">{CONTACT_EMAIL}</span>
          </a>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3.5">
            <p className="text-sm text-slate-300">
              A contact address hasn&apos;t been set up yet.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              iFLARE is an early-stage student project — this page will carry a
              real address before launch.
            </p>
          </div>
        )}
      </InfoSection>

      <InfoSection heading="Reporting a problem">
        <p>
          If something in the app is broken, the{' '}
          <Link href="/feedback" className="text-orange-400 hover:underline">
            feedback page
          </Link>{' '}
          is the fastest route — it goes to the same place and you can describe
          what happened.
        </p>
      </InfoSection>

      <InfoSection heading="Account and data requests">
        <p>
          To ask what data is held about you, or to have your account deleted,
          get in touch using the details above. See the{' '}
          <Link href="/privacy" className="text-orange-400 hover:underline">
            Privacy Policy
          </Link>{' '}
          for what iFLARE stores.
        </p>
      </InfoSection>

      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3.5">
        <MessageSquareHeart className="h-4 w-4 shrink-0 text-orange-500" />
        <p className="text-xs text-slate-400">
          This is a student project, so replies come from a real person rather
          than a support desk — please be patient.
        </p>
      </div>
    </InfoPageShell>
  )
}
