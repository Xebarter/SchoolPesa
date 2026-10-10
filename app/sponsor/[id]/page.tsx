import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CampaignProgress } from '@/components/campaign-progress'
import { Band, Bridge, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { Button } from '@/components/ui/button'
import { getBeneficiaries, getBeneficiary } from '@/lib/data'
import { formatDate, formatUGX } from '@/lib/format'

export function generateStaticParams() {
  return getBeneficiaries().map((item) => ({ id: item.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const learner = getBeneficiary((await params).id)
  return { title: learner ? `${learner.displayName}'s learning journey` : 'Learner' }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const learner = getBeneficiary((await params).id)
  if (!learner || !learner.publicProfile) notFound()
  return (
    <SiteShell>
      <article>
        {learner.publicImage && (
          <div className="relative min-h-[22rem] bg-mist lg:min-h-[32rem]">
            <Image src={learner.image} alt="" fill priority className="object-cover" sizes="100vw" />
          </div>
        )}
        <Bridge className={learner.publicImage ? undefined : 'mt-0 lg:mt-0'}>
          <Band>
            <Flow width="lg" className={`grid gap-12 pb-20 lg:grid-cols-[1.1fr_.9fr] lg:pb-28 ${learner.publicImage ? 'pt-8' : 'pt-16 lg:pt-24'}`}>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">{learner.level}</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">{learner.displayName}</h1>
                <p className="mt-3 text-sage">{learner.school} · {learner.location}</p>
                <p className="mt-5 text-lg leading-8 text-sage">{learner.storyVisible ? learner.story : 'The full story is private.'}</p>
              </div>
              <div className={`h-fit bg-mist p-6 ${learner.publicImage ? 'lg:-mt-24' : ''}`}>
                <p className="font-medium">Education need: {learner.needs}</p>
                <div className="mt-4"><CampaignProgress raised={learner.raised} target={learner.target} /></div>
                <p className="mt-2 text-sm text-sage">{formatUGX(learner.raised)} raised of {formatUGX(learner.target)}</p>
                <Button nativeButton={false} render={<Link href={`/donate?child=${learner.id}`} />} className="mt-6 rounded-full bg-brand text-white shadow-none hover:bg-brand-deep">Support {learner.displayName}</Button>
                <h2 className="mt-10 text-xl font-semibold">Updates</h2>
                <ul className="mt-4 space-y-5">
                  {learner.updates.map((update) => (
                    <li key={update.title}>
                      <p className="text-xs font-semibold uppercase tracking-[.14em] text-brand">{formatDate(update.date)}</p>
                      <p className="mt-1 font-semibold">{update.title}</p>
                      <p className="text-sm leading-6 text-sage">{update.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </Flow>
          </Band>
        </Bridge>
      </article>
    </SiteShell>
  )
}
