import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShareLinks } from '@/components/share-links'
import { SiteShell } from '@/components/site/shell'
import { Button } from '@/components/ui/button'
import { getBeneficiary, getCampaignById, getStory, stories } from '@/lib/data'
import { formatDate } from '@/lib/format'

export function generateStaticParams() {
  return stories.map((story) => ({ slug: story.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const story = getStory((await params).slug)
  return { title: story?.title ?? 'Story', description: story?.excerpt }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const story = getStory((await params).slug)
  if (!story) notFound()
  const campaign = story.campaignId ? getCampaignById(story.campaignId) : undefined
  const learner = story.beneficiaryId ? getBeneficiary(story.beneficiaryId) : undefined
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-5 py-14 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">{story.category}</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-.04em]">{story.title}</h1>
        <p className="mt-4 text-sm text-sage">{story.author} · <time dateTime={story.date}>{formatDate(story.date)}</time></p>
        <div className="relative mt-8 aspect-[1.5] overflow-hidden rounded-[2rem] bg-mist">
          <Image src={story.image} alt="" fill priority className="object-cover" />
        </div>
        {story.body.split('\n\n').map((paragraph) => <p key={paragraph.slice(0, 24)} className="mt-6 text-lg leading-8 text-sage">{paragraph}</p>)}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {story.gallery.map((src, index) => <div key={index} className="relative aspect-[1.3] overflow-hidden rounded-2xl"><Image src={src} alt="" fill className="object-cover" /></div>)}
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          {campaign && <Link href={`/campaigns/${campaign.slug}`} className="font-semibold text-forest">Related campaign: {campaign.title}</Link>}
          {learner && <Link href={`/sponsor/${learner.id}`} className="font-semibold text-forest">Related learner: {learner.displayName}</Link>}
        </div>
        <div className="mt-6"><ShareLinks title={story.title} path={`/stories/${story.slug}`} /></div>
        <div className="mt-12 rounded-3xl bg-forest p-8 text-white">
          <h2 className="text-2xl font-semibold">Help create another story like this.</h2>
          <Button nativeButton={false} render={<Link href="/donate" />} className="mt-5 rounded-full bg-brand text-white shadow-none hover:bg-brand-deep">Donate</Button>
        </div>
      </article>
    </SiteShell>
  )
}
