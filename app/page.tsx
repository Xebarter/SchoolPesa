import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen, GraduationCap, Heart, School, Wallet } from 'lucide-react'
import { CampaignCard } from '@/components/campaign-card'
import { StoryCard } from '@/components/story-card'
import { SiteShell } from '@/components/site/shell'
import { SampleNote } from '@/components/states'
import { Button } from '@/components/ui/button'
import { campaigns, impactStats, partners, stories } from '@/lib/data'
import { formatUGX } from '@/lib/format'

const steps = [
  ['01', 'Find a need', 'Discover children, students and education campaigns that need support.'],
  ['02', 'Choose how to help', 'Support tuition, books, uniforms, meals, technology or other needs.'],
  ['03', 'Make a contribution', 'Donate securely through available payment methods.'],
  ['04', 'See the impact', 'Follow updates, stories, photographs and results.'],
]

const categories = [
  ['Nursery', '/campaigns?level=Nursery'],
  ['Primary', '/campaigns?level=Primary'],
  ['Secondary', '/campaigns?level=Secondary'],
  ['University', '/campaigns?level=University'],
  ['School Fees', '/campaigns?category=School%20Fees'],
  ['Scholarships', '/campaigns?category=Scholarships'],
  ['Books', '/campaigns?category=Books'],
  ['Uniforms', '/campaigns?category=Uniforms'],
  ['Meals', '/campaigns?category=Meals'],
  ['Technology', '/campaigns?category=Technology'],
  ['Accommodation', '/campaigns?category=Accommodation'],
  ['Emergency Education Support', '/campaigns?category=Emergency%20Education%20Support'],
]

const flow = [
  ['Donation', Wallet],
  ['Education support', School],
  ['School requirements', BookOpen],
  ['A child in school', Heart],
  ['A future changed', GraduationCap],
] as const

export default function Page() {
  const featured = campaigns.filter((item) => item.status === 'active').slice(0, 4)
  const featuredStory = stories[0]
  return (
    <SiteShell>
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-16 pt-14 lg:grid-cols-2 lg:px-8 lg:pt-20">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-[#cfe0d3] bg-mist px-3 py-1.5 text-xs font-semibold text-forest">Supporting education. Changing futures.</div>
          <h1 className="max-w-xl text-5xl font-semibold leading-[1.05] tracking-[-0.05em] text-ink sm:text-6xl">Every child deserves a <span className="text-brand">chance to learn.</span></h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-sage">School Pesa connects people who want to help with children and students who need support to stay in school, from nursery through university.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button nativeButton={false} render={<Link href="/sponsor" />} size="lg" className="rounded-full bg-brand px-6 text-white shadow-none hover:bg-brand-deep">Support a child <ArrowRight data-icon="inline-end" /></Button>
            <Button nativeButton={false} render={<Link href="/campaigns" />} size="lg" variant="outline" className="rounded-full border-line px-6 text-forest shadow-none">Explore campaigns</Button>
          </div>
          <p className="mt-8 text-sm text-sage"><strong className="text-ink">{impactStats.childrenSupported.toLocaleString()} children supported</strong></p>
          <SampleNote />
        </div>
        <div className="relative overflow-hidden rounded-[2rem] bg-[#d9e8da] p-3">
          <div className="relative aspect-[.95] overflow-hidden rounded-[1.5rem]">
            <Image src="/school-pesa-hero.png" alt="Children learning together in a classroom" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-10 sm:grid-cols-4 lg:px-8">
          {[
            [impactStats.childrenSupported.toLocaleString(), 'Children supported'],
            [formatUGX(impactStats.fundsRaised), 'Funds raised'],
            [String(impactStats.schoolsReached), 'Schools reached'],
            [String(impactStats.campaignsCompleted), 'Campaigns completed'],
          ].map(([number, label]) => (
            <div key={label}>
              <p className="text-3xl font-semibold tracking-tight text-forest">{number}</p>
              <p className="mt-1 text-sm text-sage">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">Featured campaigns</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.04em]">Make learning possible.</h2>
          </div>
          <Link href="/campaigns" className="text-sm font-semibold text-forest">View all</Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {featured.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <h2 className="text-4xl font-semibold tracking-[-.04em]">How School Pesa works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(([number, title, text]) => (
              <article key={number} className="rounded-2xl border border-line p-5">
                <p className="text-sm font-semibold text-brand">{number}</p>
                <h3 className="mt-3 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-sage">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <h2 className="text-4xl font-semibold tracking-[-.04em]">Education support</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map(([label, href]) => (
            <Link key={label} href={href} className="rounded-2xl border border-line bg-white px-4 py-5 text-sm font-semibold hover:border-forest">{label}</Link>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:px-8">
          <div className="relative aspect-[1.2] overflow-hidden rounded-[2rem] bg-mist">
            <Image src={featuredStory.image} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">{featuredStory.category}</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.04em]">{featuredStory.title}</h2>
            <p className="mt-4 text-lg leading-8 text-sage">{featuredStory.excerpt}</p>
            <p className="mt-3 text-sm text-sage">Primary · Kampala</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button nativeButton={false} render={<Link href={`/stories/${featuredStory.slug}`} />} className="rounded-full bg-forest">Read story</Button>
              <Button nativeButton={false} render={<Link href="/donate" />} variant="outline" className="rounded-full">Help another child like this</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <h2 className="text-4xl font-semibold tracking-[-.04em]">Your contribution becomes</h2>
        <div className="mt-8 grid gap-3 md:grid-cols-5">
          {flow.map(([label, Icon], index) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mist text-forest"><Icon className="size-4" /></span>
              <p className="text-sm font-semibold">{index + 1}. {label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="flex items-end justify-between">
            <h2 className="text-4xl font-semibold tracking-[-.04em]">Latest stories</h2>
            <Link href="/stories" className="text-sm font-semibold text-forest">All stories</Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {stories.slice(0, 3).map((story) => <StoryCard key={story.id} story={story} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="rounded-[2rem] bg-forest px-6 py-12 text-white sm:px-12">
          <h2 className="max-w-xl text-4xl font-semibold tracking-[-.04em]">You can help a child stay in school.</h2>
          <p className="mt-4 max-w-lg text-white/70">A fee, a book or a uniform is a practical way to keep learning going.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button nativeButton={false} render={<Link href="/donate" />} className="rounded-full bg-brand text-white shadow-none hover:bg-brand-deep">Donate now</Button>
            <Button nativeButton={false} render={<Link href="/sponsor" />} className="rounded-full bg-white text-forest shadow-none">Sponsor a child</Button>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <h2 className="text-sm font-semibold uppercase tracking-[.16em] text-sage">Partners</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {partners.map((partner) => (
              <div key={partner.id} className="grid h-20 place-items-center rounded-2xl border border-line text-sm font-semibold text-forest">{partner.name}</div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  )
}

export const metadata = { title: { absolute: 'School Pesa — Supporting Education. Changing Futures.' }, description: 'Help children and students access the education support they need to learn, grow and thrive.' }
