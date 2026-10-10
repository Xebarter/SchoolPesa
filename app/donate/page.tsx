import { Suspense } from 'react'
import { DonationForm } from '@/components/donation-form'
import { SiteShell } from '@/components/site/shell'
import { LoadingState } from '@/components/states'
import { getBeneficiaries, getCampaigns } from '@/lib/data'

export const metadata = { title: 'Donate' }

const assurances = [
  ['01', 'A prompt on your phone', 'Mobile money completes the gift. No card details on this page.'],
  ['02', 'Private by default', 'Give anonymously, or leave your name and the reason for your gift. Email is optional.'],
  ['03', 'Directed with care', 'Support education where it is needed, or choose a campaign or learner.'],
]

export default function Page() {
  const campaigns = getCampaigns()
  const beneficiaries = getBeneficiaries()
  return (
    <SiteShell>
      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-5 py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.05fr)] lg:gap-20 lg:px-8 lg:py-20">
          <div className="lg:sticky lg:top-28">
            <p className="text-sm font-semibold uppercase tracking-[.18em] text-brand">School Pesa</p>
            <h1 className="mt-4 max-w-[11ch] text-5xl font-semibold leading-[0.98] tracking-[-.045em] text-ink sm:text-6xl">Give with intention.</h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-sage">A clear gift, sent in a moment. Choose an amount, confirm the number for the prompt, and let the support begin.</p>
            <ol className="mt-10 divide-y divide-line border-y border-line">
              {assurances.map(([number, title, text]) => (
                <li key={number} className="grid grid-cols-[auto_1fr] gap-5 py-5">
                  <span className="text-sm font-semibold tracking-[.14em] text-brand">{number}</span>
                  <span>
                    <span className="block font-semibold text-ink">{title}</span>
                    <span className="mt-1 block text-sm leading-6 text-sage">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <Suspense fallback={<LoadingState label="Loading donation form" />}>
            <DonationForm campaigns={campaigns} beneficiaries={beneficiaries} />
          </Suspense>
        </div>
      </section>
    </SiteShell>
  )
}
