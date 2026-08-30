import Link from 'next/link'

import InfoPageShell, { InfoSection } from '@/components/InfoPageShell'

export const metadata = {
  title: 'Terms & Conditions · iFLARE',
  description: 'The ground rules for using iFLARE.',
}

export default function TermsPage() {
  return (
    <InfoPageShell
      title="Terms & Conditions"
      subtitle="The ground rules for using iFLARE."
    >
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5">
        <p className="text-sm text-amber-200">
          iFLARE is an early-stage student project.
        </p>
        <p className="mt-1 text-xs text-amber-200/80">
          These terms are written to be readable rather than exhaustive, and
          they have not been reviewed by a lawyer.
        </p>
      </div>

      <InfoSection heading="Who can use iFLARE">
        <p>
          iFLARE is for students at Indian universities. You need a working
          university email address to sign up, and you should only use your own.
        </p>
      </InfoSection>

      <InfoSection heading="Meeting people in person">
        <p>
          iFLARE helps you find people to meet up with, but it does not verify
          who anyone is beyond their university email. Use normal judgement:
          meet in public places on or near campus, and don&apos;t share personal
          details you wouldn&apos;t share with a classmate.
        </p>
        <p>
          You take part in meetups at your own risk. iFLARE is not responsible
          for what happens at a meetup arranged through the app.
        </p>
      </InfoSection>

      <InfoSection heading="How to behave">
        <p>Don&apos;t use iFLARE to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Harass, threaten, or abuse anyone</li>
          <li>Post anything illegal, or organise anything illegal</li>
          <li>Pretend to be someone else</li>
          <li>Spam the feed or advertise to other students</li>
          <li>Create flares you have no intention of turning up to</li>
        </ul>
        <p>
          Accounts that do these things can be removed without warning.
        </p>
      </InfoSection>

      <InfoSection heading="Your content">
        <p>
          The flares and messages you post stay yours. By posting them you allow
          iFLARE to show them to the people who are meant to see them — students
          at your university for flares, and flare participants for chat.
        </p>
      </InfoSection>

      <InfoSection heading="Availability">
        <p>
          iFLARE is under active development. Features may change or break, and
          the service may be unavailable at times. We can&apos;t guarantee that
          data will never be lost while the project is at this stage.
        </p>
      </InfoSection>

      <InfoSection heading="Questions">
        <p>
          See the{' '}
          <Link href="/privacy" className="text-orange-400 hover:underline">
            Privacy Policy
          </Link>{' '}
          for what data is stored, or reach us through the{' '}
          <Link href="/contact" className="text-orange-400 hover:underline">
            contact page
          </Link>
          .
        </p>
      </InfoSection>
    </InfoPageShell>
  )
}
