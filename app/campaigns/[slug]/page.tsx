import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CampaignCard } from '@/components/campaign-card'
import { CampaignProgress } from '@/components/campaign-progress'
import { ShareLinks } from '@/components/share-links'
import { Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { Button } from '@/components/ui/button'
import { getBeneficiary, getCampaignBySlug, getCampaigns } from '@/lib/data'
import { formatDate, formatUGX, percentOf } from '@/lib/format'

export function generateStaticParams() {
  return getCampaigns().map((campaign) => ({ slug: campaign.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const campaign = getCampaignBySlug((await params).slug)
  return { title: campaign?.seoTitle ?? 'Campaign', description: campaign?.seoDescription }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const campaign = getCampaignBySlug((await params).slug)
  if (!campaign) notFound()
  const beneficiary = campaign.beneficiaryId ? getBeneficiary(campaign.beneficiaryId) : undefined
  const percent = percentOf(campaign.raised, campaign.target)
  const remaining = Math.max(campaign.target - campaign.raised, 0)
  const days = daysUntil(campaign.deadline)
  const photos = [...new Set(campaign.gallery)].filter((src) => src !== campaign.image)
  const related = getCampaigns().filter((item) => item.slug !== campaign.slug && item.status === 'active').slice(0, 2)
  const closed = campaign.status === 'completed' || days < 0

  return (
    <SiteShell>
      <article>
        <Band>
          <Flow className="py-12 lg:py-16">
            <Link href="/campaigns" className="text-sm font-semibold text-brand hover:text-brand-deep">All campaigns</Link>
            <div className="mt-6 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-mist">
                  <Image src={campaign.image} alt={campaign.title} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 70vw" />
                </div>
                <p className="mt-8 text-sm font-semibold uppercase tracking-[.16em] text-brand">{campaign.category}</p>
                <h1 className="mt-3 max-w-[16ch] text-4xl font-semibold tracking-[-.045em] text-ink sm:text-5xl">{campaign.title}</h1>
                <p className="mt-3 text-sm text-sage">{campaign.level} · {campaign.location}</p>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-sage">{campaign.description}</p>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-ink">{campaign.story}</p>

                {photos.length > 0 && (
                  <div className="mt-10 grid grid-cols-2 gap-3">
                    {photos.map((src) => (
                      <div key={src} className="relative aspect-[1.4] overflow-hidden bg-mist">
                        <Image src={src} alt="" fill className="object-cover" sizes="30vw" />
                      </div>
                    ))}
                  </div>
                )}

                {beneficiary && (
                  <Link href={`/sponsor/${beneficiary.id}`} className="mt-10 flex items-center gap-4 bg-mist p-4 transition-colors hover:bg-gold">
                    <span className="relative size-16 shrink-0 overflow-hidden bg-cream">
                      {beneficiary.publicImage ? <Image src={beneficiary.image} alt="" fill className="object-cover" sizes="64px" /> : null}
                    </span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-[.14em] text-brand">Learner</span>
                      <span className="mt-1 block font-semibold text-ink">{beneficiary.displayName}</span>
                      <span className="block text-sm text-sage">{beneficiary.level} · {beneficiary.location}</span>
                    </span>
                  </Link>
                )}

                <h2 className="mt-14 text-2xl font-semibold tracking-[-.03em]">Updates</h2>
                {campaign.updates.length === 0 ? (
                  <p className="mt-3 text-sm text-sage">Updates will appear here as this campaign moves forward.</p>
                ) : (
                  <ol className="mt-6 border-l border-line">
                    {campaign.updates.map((update) => (
                      <li key={update.id} className="py-5 pl-6">
                        <p className="text-xs font-semibold uppercase tracking-[.14em] text-brand">{formatDate(update.date)}</p>
                        <h3 className="mt-1 font-semibold text-ink">{update.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-sage">{update.body}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <aside className="bg-mist p-6 sm:p-7 lg:sticky lg:top-24">
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-brand">{closed ? 'Campaign closed' : `${percent}% funded`}</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-.03em] text-ink">{formatUGX(campaign.raised)}</p>
                <p className="mt-1 text-sm text-sage">of {formatUGX(campaign.target)}</p>
                <div className="mt-5"><CampaignProgress raised={campaign.raised} target={campaign.target} /></div>
                <dl className="mt-6 divide-y divide-line text-sm">
                  <Row label="Still needed" value={remaining === 0 ? 'Fully funded' : formatUGX(remaining)} />
                  <Row label="Donors" value={String(campaign.donors)} />
                  <Row label="Deadline" value={formatDate(campaign.deadline)} />
                  <Row label="Time left" value={closed ? 'Closed' : days === 0 ? 'Last day' : `${days} days`} />
                </dl>
                {closed ? (
                  <p className="mt-6 text-sm leading-6 text-sage">This campaign is no longer taking gifts. You can still support another open campaign.</p>
                ) : (
                  <Button nativeButton={false} render={<Link href={`/donate?campaign=${campaign.slug}`} />} className="mt-6 h-12 w-full rounded-full bg-brand text-white shadow-none hover:bg-brand-deep">Support this campaign</Button>
                )}
                <div className="mt-6 border-t border-line pt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-sage">Share</p>
                  <ShareLinks title={campaign.title} path={`/campaigns/${campaign.slug}`} />
                </div>
              </aside>
            </div>
          </Flow>
        </Band>
        {related.length > 0 && (
          <Band tone="mist">
            <Flow className="py-16 lg:py-20">
              <h2 className="text-3xl font-semibold tracking-[-.03em]">Other campaigns</h2>
              <div className="mt-10 grid gap-x-10 gap-y-14 md:grid-cols-2">
                {related.map((item) => <CampaignCard key={item.id} campaign={item} />)}
              </div>
            </Flow>
          </Band>
        )}
      </article>
    </SiteShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-sage">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  )
}

function daysUntil(iso: string) {
  const end = new Date(`${iso}T00:00:00`)
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}
