import Link from 'next/link'
import { CampaignBars, DonationsArea, LevelDonut } from '@/components/charts'
import { SiteShell } from '@/components/site/shell'
import { SampleNote } from '@/components/states'
import { campaignBars, campaigns, donationSeries, impactStats, levelSplit, stories } from '@/lib/data'
import { formatDate, formatUGX } from '@/lib/format'

export const metadata = { title: 'Our impact' }

const stats = [
  [impactStats.childrenSupported.toLocaleString(), 'Children supported'],
  [String(impactStats.schoolsReached), 'Schools reached'],
  [String(impactStats.scholarships), 'Scholarships funded'],
  [impactStats.books.toLocaleString(), 'Books provided'],
  [impactStats.uniforms.toLocaleString(), 'Uniforms provided'],
  [formatUGX(impactStats.fundsRaised), 'Total funds raised'],
]

export default function Page() {
  const completed = campaigns.filter((item) => item.status === 'completed')
  return (
    <SiteShell>
      <section className="bg-forest text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">Proof of possibility</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-.05em]">See what your support makes possible.</h1>
          <p className="mt-5 max-w-xl text-lg text-white/70">From contribution to classroom, the path stays visible.</p>
          <SampleNote className="mt-4 text-white/60" />
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
        {stats.map(([number, label]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-7">
            <p className="text-4xl font-semibold text-forest">{number}</p>
            <p className="mt-2 text-sm text-sage">{label}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-8 lg:px-8">
        <h2 className="text-3xl font-semibold">Where your money goes</h2>
        <p className="mt-3 text-sage">Funds raised → education support → children → impact</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-line bg-white p-5"><h3 className="font-semibold">Donations over time</h3><DonationsArea data={donationSeries} /></article>
          <article className="rounded-2xl border border-line bg-white p-5"><h3 className="font-semibold">Donations by campaign</h3><CampaignBars data={campaignBars} /></article>
          <article className="rounded-2xl border border-line bg-white p-5"><h3 className="font-semibold">Education support</h3><LevelDonut data={levelSplit} /></article>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-2xl font-semibold">Completed campaigns</h2>
          <ul className="mt-4 space-y-3">
            {completed.map((item) => <li key={item.id} className="rounded-2xl border border-line bg-white p-4"><Link href={`/campaigns/${item.slug}`} className="font-semibold">{item.title}</Link><p className="text-sm text-sage">{formatUGX(item.raised)} raised</p></li>)}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Impact stories</h2>
          <ul className="mt-4 space-y-3">
            {stories.slice(0, 3).map((story) => <li key={story.id} className="rounded-2xl border border-line bg-white p-4"><Link href={`/stories/${story.slug}`} className="font-semibold">{story.title}</Link><p className="text-sm text-sage">{formatDate(story.date)}</p></li>)}
          </ul>
        </div>
      </section>
    </SiteShell>
  )
}
