import Link from 'next/link'
import { CampaignBars, DonationsArea, LevelDonut } from '@/components/charts'
import { Band, Bridge, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { SampleNote } from '@/components/states'
import { getCampaignBars, getCampaigns, getDonationSeries, getImpact, getLevelSplit, getStories } from '@/lib/data'
import { formatDate, formatUGX } from '@/lib/format'

export const metadata = { title: 'Our impact' }

export default function Page() {
  const campaigns = getCampaigns()
  const stories = getStories()
  const impactStats = getImpact()
  const donationSeries = getDonationSeries()
  const campaignBars = getCampaignBars()
  const levelSplit = getLevelSplit()
  const stats = [
    [impactStats.childrenSupported.toLocaleString(), 'Children supported'],
    [String(impactStats.schoolsReached), 'Schools reached'],
    [String(impactStats.scholarships), 'Scholarships funded'],
    [impactStats.books.toLocaleString(), 'Books provided'],
    [impactStats.uniforms.toLocaleString(), 'Uniforms provided'],
    [formatUGX(impactStats.fundsRaised), 'Total funds raised'],
  ]
  const completed = campaigns.filter((item) => item.status === 'completed')
  return (
    <SiteShell>
      <Band tone="forest">
        <Flow className="grid items-end gap-8 pb-24 pt-16 lg:grid-cols-[1.15fr_.75fr] lg:gap-16 lg:pb-32 lg:pt-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-white/60">Proof of possibility</p>
            <h1 className="mt-4 max-w-[12ch] text-5xl font-semibold leading-[0.98] tracking-[-.05em] sm:text-6xl">See what your support makes possible.</h1>
          </div>
          <div className="lg:pb-2">
            <p className="max-w-sm text-lg text-white/70">From contribution to classroom, the path stays visible.</p>
            <SampleNote className="mt-4 text-white/50" />
          </div>
        </Flow>
      </Band>
      <Bridge>
        <Band tone="mist">
          <Flow className="grid items-end gap-x-10 gap-y-8 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:py-16">
            {stats.map(([number, label], index) => (
              <div key={label} className={index === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}>
                <p className={index === 0 ? 'text-6xl font-semibold tracking-[-.05em] text-forest' : 'text-4xl font-semibold tracking-[-.04em] text-forest'}>{number}</p>
                <p className="mt-2 text-sm text-sage">{label}</p>
              </div>
            ))}
          </Flow>
          <Flow className="pb-16 lg:pb-24">
            <h2 className="text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Where your money goes</h2>
            <p className="mt-3 text-sage">Funds raised, then education support, then children, then impact.</p>
            <div className="mt-10 grid gap-10 lg:grid-cols-3">
              <article><h3 className="font-semibold">Donations over time</h3><DonationsArea data={donationSeries} /></article>
              <article><h3 className="font-semibold">Donations by campaign</h3><CampaignBars data={campaignBars} /></article>
              <article><h3 className="font-semibold">Education support</h3><LevelDonut data={levelSplit} /></article>
            </div>
          </Flow>
        </Band>
      </Bridge>
      <Band>
        <Flow className="grid gap-16 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-.03em]">Completed campaigns</h2>
            <ul className="mt-6 space-y-6">
              {completed.map((item) => (
                <li key={item.id}>
                  <Link href={`/campaigns/${item.slug}`} className="text-lg font-semibold hover:text-brand">{item.title}</Link>
                  <p className="text-sm text-sage">{formatUGX(item.raised)} raised</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-[-.03em]">Impact stories</h2>
            <ul className="mt-6 space-y-6">
              {stories.slice(0, 3).map((story) => (
                <li key={story.id}>
                  <Link href={`/stories/${story.slug}`} className="text-lg font-semibold hover:text-brand">{story.title}</Link>
                  <p className="text-sm text-sage">{formatDate(story.date)}</p>
                </li>
              ))}
            </ul>
          </div>
        </Flow>
      </Band>
    </SiteShell>
  )
}
