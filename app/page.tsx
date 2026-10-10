import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen, GraduationCap, Heart, School, Wallet } from 'lucide-react'
import { CampaignCard } from '@/components/campaign-card'
import { QuickGive } from '@/components/quick-give'
import { StoryCard } from '@/components/story-card'
import { Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { Button } from '@/components/ui/button'
import { getCampaigns, getPartners, getStories } from '@/lib/data'

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
  const campaigns = getCampaigns()
  const partners = getPartners()
  const stories = getStories()
  const featured = campaigns.filter((item) => item.status === 'active').slice(0, 4)
  const featuredStory = stories[0]
  return (
    <SiteShell>
      <section className="relative bg-cream">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
          <div className="relative z-10 px-5 pb-14 pt-14 lg:px-8 lg:pb-20 lg:pt-20">
            <p className="hidden text-sm font-semibold uppercase tracking-[.18em] text-brand lg:block">Supporting education. Changing futures.</p>
            <h1 className="max-w-[11ch] text-5xl font-semibold leading-[0.96] tracking-[-0.05em] text-ink sm:text-6xl lg:mt-5 lg:text-7xl">Every child<br />deserves a<br /><span className="text-brand">chance to learn.</span></h1>
            <p className="mt-6 hidden max-w-lg text-lg leading-8 text-sage lg:block">School Pesa connects people who want to help with children and students who need support to stay in school, from nursery through university.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button nativeButton={false} render={<Link href="/sponsor" />} size="lg" className="rounded-full bg-brand px-6 text-white shadow-none hover:bg-brand-deep">Support a child <ArrowRight data-icon="inline-end" /></Button>
              <Button nativeButton={false} render={<Link href="/campaigns" />} size="lg" variant="outline" className="rounded-full border-line px-6 text-forest shadow-none">Explore campaigns</Button>
            </div>
          </div>
        </div>
        <div className="relative -mt-16 aspect-[4/5] bg-mist sm:aspect-[5/4] lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:aspect-auto lg:w-[48%]">
          <Image src="/school-pesa-hero.png" alt="Children learning together in a classroom" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 46vw" />
        </div>
      </section>

      <Band>
        <Flow className="py-12 lg:py-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">Featured campaigns</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] lg:text-5xl">Make learning possible.</h2>
            </div>
            <Link href="/campaigns" className="hidden shrink-0 text-sm font-semibold text-forest transition-colors hover:text-brand lg:inline">View all</Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 lg:mt-10 lg:grid-cols-4 lg:gap-5">
            {featured.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} compact />)}
          </div>
          <Link href="/campaigns" className="mt-5 flex h-11 items-center justify-center rounded-full border border-line text-sm font-semibold text-ink lg:hidden">View more</Link>
        </Flow>
      </Band>

      <Band>
        <Flow className="pb-28 lg:pb-36">
          <h2 className="text-4xl font-semibold tracking-[-.04em] sm:text-5xl">How School Pesa works</h2>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.45fr_1fr_1fr_1fr]">
            {steps.map(([number, title, text], index) => (
              <article key={number}>
                <p className={index === 0 ? 'text-6xl font-semibold tracking-[-.05em] text-brand sm:text-7xl' : 'text-4xl font-semibold tracking-[-.05em] text-brand'}>{number}</p>
                <h3 className={index === 0 ? 'mt-4 max-w-[10ch] text-3xl font-semibold tracking-[-.03em]' : 'mt-4 text-xl font-semibold'}>{title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-sage">{text}</p>
              </article>
            ))}
          </div>
          <h2 className="mt-20 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Education support</h2>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            {categories.map(([label, href]) => (
              <Link key={label} href={href} className="text-lg font-semibold text-forest transition-colors hover:text-brand">{label}</Link>
            ))}
          </div>
        </Flow>
      </Band>

      <Band tone="mist">
        <Flow className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="relative -mt-24 aspect-[1.15] bg-forest lg:-mt-32">
            <Image src={featuredStory.image} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">{featuredStory.category}</p>
            <h2 className="mt-3 max-w-[12ch] text-4xl font-semibold leading-[1.02] tracking-[-.04em] sm:text-5xl">{featuredStory.title}</h2>
            <p className="mt-4 max-w-md text-lg leading-8 text-sage">{featuredStory.excerpt}</p>
            <p className="mt-3 text-sm text-sage">Primary · Kampala</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button nativeButton={false} render={<Link href={`/stories/${featuredStory.slug}`} />} className="rounded-full bg-forest">Read story</Button>
              <Button nativeButton={false} render={<Link href="/donate" />} variant="outline" className="rounded-full border-forest/20 bg-cream">Help another child like this</Button>
            </div>
          </div>
        </Flow>
        <Flow className="pb-16 lg:pb-24">
          <h2 className="text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Your contribution becomes</h2>
          <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-center">
            {flow.map(([label, Icon], index) => (
              <div key={label} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center bg-forest text-white"><Icon className="size-4" /></span>
                <p className="text-sm font-semibold">{index + 1}. {label}</p>
                {index < flow.length - 1 ? <span className="ml-2 hidden h-px min-w-4 flex-1 bg-forest/25 md:block" aria-hidden /> : null}
              </div>
            ))}
          </div>
        </Flow>
      </Band>

      <Band>
        <Flow className="py-20 lg:py-28">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Latest stories</h2>
            <Link href="/stories" className="text-sm font-semibold text-forest transition-colors hover:text-brand">All stories</Link>
          </div>
          <div className="mt-14 grid items-start gap-x-12 gap-y-12 lg:grid-cols-[1.35fr_.8fr]">
            {stories[0] ? <StoryCard story={stories[0]} emphasis /> : null}
            <div className="grid gap-10">
              {stories.slice(1, 3).map((story) => <StoryCard key={story.id} story={story} />)}
            </div>
          </div>
        </Flow>
      </Band>

      <Band tone="forest">
        <Flow className="py-20 lg:py-28">
          <h2 className="max-w-xl text-4xl font-semibold tracking-[-.04em] sm:text-5xl">You can help a child stay in school.</h2>
          <p className="mt-4 max-w-lg text-lg text-white/70">A fee, a book or a uniform is a practical way to keep learning going.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button nativeButton={false} render={<Link href="/donate" />} className="rounded-full bg-white text-ink shadow-none hover:bg-cream">Donate now</Button>
            <Button nativeButton={false} render={<Link href="/sponsor" />} className="rounded-full border border-white/25 bg-transparent text-white shadow-none hover:bg-white/10">Sponsor a child</Button>
          </div>
          <p className="mt-16 text-sm font-semibold uppercase tracking-[.16em] text-white/50">Partners</p>
          <div className="mt-5 flex flex-wrap gap-x-10 gap-y-3">
            {partners.map((partner) => (
              <p key={partner.id} className="text-lg font-semibold text-white">{partner.name}</p>
            ))}
          </div>
        </Flow>
      </Band>
      <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-3 sm:right-5">
        <QuickGive />
        <a
          href="https://wa.me/256773936892"
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-40 inline-flex h-12 shrink-0 items-center gap-2.5 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(22,29,36,0.55)] transition-colors hover:bg-[#1ebe5d]"
        >
          <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
            <path fillRule="evenodd" d="M12 2.2A9.8 9.8 0 0 0 3.7 17.3L2.4 21.6l4.4-1.2A9.8 9.8 0 1 0 12 2.2Zm0 1.7a8.1 8.1 0 0 1 6.9 12.4l.2.3.7 2.5-2.6-.7-.3-.1A8.1 8.1 0 1 1 12 3.9Zm-2.9 3.6c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1 0 1.3.9 2.5 1.1 2.6.1.2 1.8 2.8 4.4 3.8 2.2.9 2.6.7 3.1.6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3-.3-.1-1.5-.7-1.8-.8-.2-.1-.4-.1-.6.1-.2.3-.7.8-.8 1-.2.2-.3.2-.6.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.5-1.4-1.8-.2-.3 0-.4.1-.5.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.3 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.4Z" />
          </svg>
          WhatsApp
        </a>
      </div>
    </SiteShell>
  )
}

export const metadata = { title: { absolute: 'School Pesa — Supporting Education. Changing Futures.' }, description: 'Help children and students access the education support they need to learn, grow and thrive.' }
