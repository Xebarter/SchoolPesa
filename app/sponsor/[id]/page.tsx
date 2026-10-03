import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CampaignProgress } from '@/components/campaign-progress'
import { SiteShell } from '@/components/site/shell'
import { Button } from '@/components/ui/button'
import { beneficiaries, getBeneficiary } from '@/lib/data'
import { formatDate, formatUGX } from '@/lib/format'

export function generateStaticParams() {
  return beneficiaries.map((item) => ({ id: item.id }))
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
      <article className="mx-auto grid max-w-5xl gap-8 px-5 py-14 lg:grid-cols-[1fr_1fr] lg:px-8">
        {learner.publicImage && <div className="relative aspect-[1.1] overflow-hidden rounded-[2rem] bg-mist"><Image src={learner.image} alt="" fill className="object-cover" /></div>}
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand">{learner.level}</p>
          <h1 className="mt-3 text-4xl font-semibold">{learner.displayName}</h1>
          <p className="mt-3 text-sage">{learner.school} · {learner.location}</p>
          <p className="mt-5 leading-7 text-sage">{learner.storyVisible ? learner.story : 'The full story is private.'}</p>
          <p className="mt-4 font-medium">Education need: {learner.needs}</p>
          <div className="mt-4"><CampaignProgress raised={learner.raised} target={learner.target} /></div>
          <p className="mt-2 text-sm text-sage">{formatUGX(learner.raised)} raised of {formatUGX(learner.target)}</p>
          <Button nativeButton={false} render={<Link href={`/donate?child=${learner.id}`} />} className="mt-6 rounded-full bg-brand text-white shadow-none hover:bg-brand-deep">Support {learner.displayName}</Button>
          <h2 className="mt-8 text-xl font-semibold">Updates</h2>
          <ul className="mt-3 space-y-3">
            {learner.updates.map((update) => (
              <li key={update.title} className="rounded-2xl border border-line bg-white p-4">
                <p className="text-xs text-sage">{formatDate(update.date)}</p>
                <p className="font-semibold">{update.title}</p>
                <p className="text-sm text-sage">{update.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </SiteShell>
  )
}
