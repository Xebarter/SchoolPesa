import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CampaignProgress } from '@/components/campaign-progress'
import { ShareLinks } from '@/components/share-links'
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
  return (
    <SiteShell>
      <article className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1.4fr_.8fr] lg:px-8">
        <div>
          <div className="relative aspect-[1.6] overflow-hidden rounded-[2rem] bg-mist">
            <Image src={campaign.image} alt={campaign.title} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 60vw" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {campaign.gallery.map((src, index) => (
              <div key={`${src}-${index}`} className="relative aspect-[1.4] overflow-hidden rounded-2xl bg-mist">
                <Image src={src} alt="" fill className="object-cover" sizes="30vw" />
              </div>
            ))}
          </div>
          <h1 className="mt-8 text-4xl font-semibold tracking-[-.04em]">{campaign.title}</h1>
          <p className="mt-3 text-sm text-sage">{campaign.level} · {campaign.location} · {campaign.category}</p>
          <p className="mt-6 text-lg leading-8 text-sage">{campaign.description}</p>
          <h2 className="mt-10 text-2xl font-semibold">The story</h2>
          <p className="mt-3 leading-7 text-sage">{campaign.story}</p>
          {beneficiary && <p className="mt-4 text-sm">Connected learner: <Link className="font-semibold text-forest" href={`/sponsor/${beneficiary.id}`}>{beneficiary.displayName}</Link></p>}
          <h2 className="mt-10 text-2xl font-semibold">Campaign updates</h2>
          {campaign.updates.length === 0 ? <p className="mt-3 text-sm text-sage">Updates will appear here as the campaign progresses.</p> : (
            <ol className="mt-4 space-y-4 border-l border-line pl-5">
              {campaign.updates.map((update) => (
                <li key={update.id}>
                  <p className="text-xs text-sage">{formatDate(update.date)}</p>
                  <h3 className="font-semibold">{update.title}</h3>
                  <p className="text-sm text-sage">{update.body}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
        <aside className="h-fit rounded-3xl border border-line bg-white p-6 lg:sticky lg:top-24">
          <p className="text-3xl font-semibold text-forest">{formatUGX(campaign.raised)}</p>
          <p className="text-sm text-sage">raised of {formatUGX(campaign.target)}</p>
          <div className="mt-4"><CampaignProgress raised={campaign.raised} target={campaign.target} /></div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-sage">Funded</dt><dd>{percent}%</dd></div>
            <div className="flex justify-between"><dt className="text-sage">Donors</dt><dd>{campaign.donors}</dd></div>
            <div className="flex justify-between"><dt className="text-sage">Deadline</dt><dd>{formatDate(campaign.deadline)}</dd></div>
            <div className="flex justify-between"><dt className="text-sage">Status</dt><dd className="capitalize">{campaign.status}</dd></div>
          </dl>
          <Button nativeButton={false} render={<Link href={`/donate?campaign=${campaign.slug}`} />} className="mt-6 h-12 w-full rounded-full bg-brand text-white shadow-none hover:bg-brand-deep">Donate</Button>
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold">Share campaign</p>
            <ShareLinks title={campaign.title} path={`/campaigns/${campaign.slug}`} />
          </div>
        </aside>
      </article>
    </SiteShell>
  )
}
