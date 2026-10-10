import { Suspense } from 'react'
import Image from 'next/image'
import { DonationForm } from '@/components/donation-form'
import { CampaignProgress } from '@/components/campaign-progress'
import { SiteShell } from '@/components/site/shell'
import { LoadingState } from '@/components/states'
import { getBeneficiaries, getCampaigns } from '@/lib/data'
import { donorPreferences } from '@/lib/donor'
import { currentAccount } from '@/lib/supabase/session'
import { formatUGX, percentOf } from '@/lib/format'

export const metadata = { title: 'Donate' }

const assurances = [
  ['01', 'A prompt on your phone', 'Mobile money completes the gift. No card details on this page.'],
  ['02', 'Private by default', 'Give anonymously, or leave your name and the reason for your gift. Email is optional.'],
  ['03', 'Directed with care', 'Support education where it is needed, or choose a campaign or learner.'],
]

export default async function Page({ searchParams }: { searchParams: Promise<{ campaign?: string }> }) {
  const { campaign: slug } = await searchParams
  const account = await currentAccount()
  const anonymousDefault = account ? donorPreferences(account.email).anonymousDefault : true
  const campaigns = getCampaigns()
  const beneficiaries = getBeneficiaries()
  const campaign = slug ? campaigns.find((item) => item.slug === slug) : undefined
  return (
    <SiteShell>
      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl items-start gap-8 px-5 py-8 sm:gap-12 sm:py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.05fr)] lg:gap-20 lg:px-8 lg:py-20">
          {campaign ? (
            <div className="lg:sticky lg:top-28">
              <div className="relative -mx-5 h-44 overflow-hidden bg-mist sm:mx-0 sm:h-auto sm:aspect-[16/9] lg:aspect-[4/3]">
                <Image src={campaign.image} alt="" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 42vw" />
              </div>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[.16em] text-brand sm:text-sm">{campaign.category} · {campaign.location}</p>
              <h1 className="mt-2 text-3xl font-semibold leading-[1.05] tracking-[-.04em] text-ink sm:text-5xl">{campaign.title}</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-sage sm:text-base sm:leading-7">{campaign.summary}</p>
              <div className="mt-5">
                <CampaignProgress raised={campaign.raised} target={campaign.target} />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-sage">
                  <span className="font-semibold text-ink">{formatUGX(campaign.raised)} raised</span>
                  <span>{percentOf(campaign.raised, campaign.target)}% of {formatUGX(campaign.target)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-semibold uppercase tracking-[.18em] text-brand">School Pesa</p>
              <h1 className="mt-4 max-w-[11ch] text-4xl font-semibold leading-[0.98] tracking-[-.045em] text-ink sm:text-6xl">Give with intention.</h1>
              <p className="mt-5 max-w-md text-base leading-7 text-sage sm:text-lg sm:leading-8">A clear gift, sent in a moment. Choose an amount, confirm the number for the prompt, and let the support begin.</p>
              <ol className="mt-8 divide-y divide-line border-y border-line sm:mt-10">
                {assurances.map(([number, title, text]) => (
                  <li key={number} className="grid grid-cols-[auto_1fr] gap-4 py-4 sm:gap-5 sm:py-5">
                    <span className="text-sm font-semibold tracking-[.14em] text-brand">{number}</span>
                    <span>
                      <span className="block font-semibold text-ink">{title}</span>
                      <span className="mt-1 block text-sm leading-6 text-sage">{text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <Suspense fallback={<LoadingState label="Loading donation form" />}>
            <DonationForm campaigns={campaigns} beneficiaries={beneficiaries} focus={campaign} anonymousDefault={anonymousDefault} />
          </Suspense>
        </div>
      </section>
    </SiteShell>
  )
}
