import Image from 'next/image'
import Link from 'next/link'
import { CampaignProgress } from '@/components/campaign-progress'
import { PageHeader } from '@/components/page-header'
import { SiteShell } from '@/components/site/shell'
import { EmptyState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { beneficiaries } from '@/lib/data'
import { formatUGX } from '@/lib/format'
import type { EducationLevel } from '@/lib/types'

const levels: Array<EducationLevel | 'All'> = ['All', 'Nursery', 'Primary', 'Secondary', 'University']

export const metadata = { title: 'Sponsor a child' }

export default async function Page({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level } = await searchParams
  const list = beneficiaries.filter((item) => item.publicProfile && (!level || level === 'All' || item.level === level))
  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <PageHeader eyebrow="Meet the learners" title="Help a child stay in school." text="Support education while protecting each learner’s privacy and dignity. Profiles use a display name and a general location." />
        <div className="mt-8 flex flex-wrap gap-2">
          {levels.map((item) => (
            <Link key={item} href={item === 'All' ? '/sponsor' : `/sponsor?level=${item}`} className={`rounded-full px-4 py-2 text-sm font-semibold ${(!level && item === 'All') || level === item ? 'bg-forest text-white' : 'border border-line bg-white text-sage'}`}>{item}</Link>
          ))}
        </div>
        {list.length === 0 ? <div className="mt-8"><EmptyState title="No learners in this level" body="Try another education level." /></div> : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((learner) => (
              <article key={learner.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                {learner.publicImage && <div className="relative aspect-[1.2] bg-mist"><Image src={learner.image} alt="" fill className="object-cover" sizes="33vw" /></div>}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand">{learner.level} · {learner.location}</p>
                  <h2 className="mt-2 text-xl font-semibold">{learner.displayName}&apos;s learning journey</h2>
                  <p className="mt-2 text-sm text-sage">{learner.storyVisible ? learner.story : 'This story is kept private.'}</p>
                  <p className="mt-3 text-sm font-medium">Needs: {learner.needs}</p>
                  <div className="mt-3"><CampaignProgress raised={learner.raised} target={learner.target} /></div>
                  <p className="mt-2 text-xs text-sage">{formatUGX(learner.raised)} of {formatUGX(learner.target)}</p>
                  <Button nativeButton={false} render={<Link href={`/sponsor/${learner.id}`} />} className="mt-5 w-full rounded-full bg-forest text-white shadow-none">View profile</Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  )
}
