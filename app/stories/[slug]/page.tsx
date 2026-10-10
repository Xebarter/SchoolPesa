import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShareLinks } from '@/components/share-links'
import { Band, Bridge, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { Button } from '@/components/ui/button'
import { getBeneficiary, getCampaignById, getStories, getStory } from '@/lib/data'
import { formatDate } from '@/lib/format'

export function generateStaticParams() {
  return getStories().map((story) => ({ slug: story.slug }))
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
      <article>
        <Band>
          <Flow width="md" className="pb-20 pt-16 lg:pb-28 lg:pt-24">
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">{story.category}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-.045em] sm:text-6xl">{story.title}</h1>
            <p className="mt-4 text-sm text-sage">{story.author} · <time dateTime={story.date}>{formatDate(story.date)}</time></p>
          </Flow>
        </Band>
        <div className="relative h-[24rem] bg-mist sm:h-[32rem]">
          <Image src={story.image} alt="" fill priority className="object-cover" sizes="100vw" />
        </div>
        <Bridge>
          <Band>
            <Flow width="md" className="pb-16 pt-6 lg:pb-24">
              {story.body.split('\n\n').map((paragraph) => <p key={paragraph.slice(0, 24)} className="mt-6 text-lg leading-8 text-sage">{paragraph}</p>)}
              {story.gallery.length > 0 && (
                <div className="mt-10 grid gap-3 sm:grid-cols-2">
                  {story.gallery.map((src, index) => <div key={index} className="relative aspect-[1.3] overflow-hidden bg-mist"><Image src={src} alt="" fill className="object-cover" sizes="40vw" /></div>)}
                </div>
              )}
              <div className="mt-8 flex flex-wrap gap-4 text-sm">
                {campaign && <Link href={`/campaigns/${campaign.slug}`} className="font-semibold text-forest hover:text-brand">Related campaign: {campaign.title}</Link>}
                {learner && <Link href={`/sponsor/${learner.id}`} className="font-semibold text-forest hover:text-brand">Related learner: {learner.displayName}</Link>}
              </div>
              <div className="mt-6"><ShareLinks title={story.title} path={`/stories/${story.slug}`} /></div>
            </Flow>
          </Band>
        </Bridge>
        <Band tone="forest">
          <Flow width="md" className="py-16 lg:py-20">
            <h2 className="text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Help create another story like this.</h2>
            <Button nativeButton={false} render={<Link href="/donate" />} className="mt-6 rounded-full bg-white text-ink shadow-none hover:bg-cream">Donate</Button>
          </Flow>
        </Band>
      </article>
    </SiteShell>
  )
}
