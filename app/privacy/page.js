import Link from 'next/link'

import InfoPageShell, { InfoSection } from '@/components/InfoPageShell'

export const metadata = {
  title: 'Privacy Policy · iFLARE',
  description: 'What iFLARE stores about you and how it is used.',
}

export default function PrivacyPage() {
  return (
    <InfoPageShell
      title="Privacy Policy"
      subtitle="Plain-language summary of what iFLARE stores and why."
    >
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5">
        <p className="text-sm text-amber-200">
          iFLARE is an early-stage student project.
        </p>
        <p className="mt-1 text-xs text-amber-200/80">
          This page describes how the app currently works. It is written to be
          accurate and readable rather than exhaustive, and it has not been
          reviewed by a lawyer.
        </p>
      </div>

      <InfoSection heading="What we store">
        <p>When you create an account, iFLARE stores:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Your name (shown to others on flares you host or join)</li>
          <li>Your university email address</li>
          <li>
            The domain of that email — this is what scopes you to your
            university
          </li>
          <li>Your selected interests, and your bio if you write one</li>
          <li>A scrambled version of your password, never the password itself</li>
        </ul>
        <p>
          As you use the app, it also stores the flares you create or join, and
          the chat messages you send inside a flare.
        </p>
      </InfoSection>

      <InfoSection heading="Who can see it">
        <p>
          Your name and interests are visible to other students at your own
          university when you host or join a flare. Flares are only shown to
          people whose email domain matches the host&apos;s, so students at other
          universities do not see your flares in their feed.
        </p>
        <p>
          Chat inside a flare is limited to the host and the people who have
          joined it.
        </p>
        <p>
          Your email address and password are never shown to other users.
        </p>
      </InfoSection>

      <InfoSection heading="What we don't do">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>We don&apos;t sell your data.</li>
          <li>We don&apos;t show third-party advertising.</li>
          <li>
            We don&apos;t track your location. Flare venues are places you pick
            yourself from a list — the app does not read your device location.
          </li>
        </ul>
      </InfoSection>

      <InfoSection heading="Security">
        <p>
          Passwords are stored scrambled rather than in plain text, and access to
          flares and chat is checked on the server. That said, iFLARE is still
          in development and its security has not been independently audited —
          please don&apos;t reuse an important password here.
        </p>
      </InfoSection>

      <InfoSection heading="Notifications">
        <p>
          If you allow browser notifications, that permission is granted by your
          browser and can be withdrawn there at any time. Notification history
          shown inside the app is kept on your own device.
        </p>
      </InfoSection>

      <InfoSection heading="Your data">
        <p>
          You can update your interests and bio from your profile at any time. To
          request a copy of your data or have your account deleted, get in touch
          through the{' '}
          <Link href="/contact" className="text-orange-400 hover:underline">
            contact page
          </Link>
          .
        </p>
      </InfoSection>
    </InfoPageShell>
  )
}
