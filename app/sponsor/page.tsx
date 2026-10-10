import Image from 'next/image'
import Link from 'next/link'
import { CampaignProgress } from '@/components/campaign-progress'
import { PageHeader } from '@/components/page-header'
import { chipClass, Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { EmptyState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { getBeneficiaries } from '@/lib/data'
import { formatUGX } from '@/lib/format'
import type { EducationLevel } from '@/lib/types'

const levels: Array<EducationLevel | 'All'> = ['All', 'Nursery', 'Primary', 'Secondary', 'University']

export const metadata = { title: 'Sponsor a child' }

export default async function Page({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level } = await searchParams
  const beneficiaries = getBeneficiaries()
  const list = beneficiaries.filter((item) => item.publicProfile && (!level || level === 'All' || item.level === level))
  return (
    <SiteShell>
      <Band>
        <Flow className="py-16 lg:py-24">
          <PageHeader layout="split" eyebrow="Meet the learners" title="Help a child stay in school." text="Support education while protecting each learner’s privacy and dignity. Profiles use a display name and a general location." />
          <div className="mt-10 flex flex-wrap gap-2">
            {levels.map((item) => (
              <Link key={item} href={item === 'All' ? '/sponsor' : `/sponsor?level=${item}`} className={chipClass((!level && item === 'All') || level === item)}>{item}</Link>
            ))}
          </div>
          {list.length === 0 ? <div className="mt-10"><EmptyState title="No learners in this level" body="Try another education level." /></div> : (
            <div className="mt-14 grid items-start gap-x-12 gap-y-14 lg:grid-cols-[1.35fr_.8fr]">
              <article>
                {list[0].publicImage && (
                  <Link href={`/sponsor/${list[0].id}`} className="group relative block aspect-[1.05] overflow-hidden bg-mist">
                    <Image src={list[0].image} alt="" fill className="motion-scale object-cover group-hover:scale-[1.03]" sizes="50vw" />
                  </Link>
                )}
                <div className={list[0].publicImage ? 'pt-5' : ''}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand">{list[0].level} · {list[0].location}</p>
                  <h2 className="mt-2 max-w-[14ch] text-4xl font-semibold leading-[1.05] tracking-[-.03em]">
                    <Link href={`/sponsor/${list[0].id}`} className="transition-colors hover:text-brand">{list[0].displayName}&apos;s learning journey</Link>
                  </h2>
                  <p className="mt-2 max-w-md text-base leading-7 text-sage">{list[0].storyVisible ? list[0].story : 'This story is kept private.'}</p>
                  <p className="mt-3 text-sm font-medium">Needs: {list[0].needs}</p>
                  <div className="mt-3"><CampaignProgress raised={list[0].raised} target={list[0].target} /></div>
                  <p className="mt-2 text-xs text-sage">{formatUGX(list[0].raised)} of {formatUGX(list[0].target)}</p>
                  <Button nativeButton={false} render={<Link href={`/sponsor/${list[0].id}`} />} className="mt-5 rounded-full bg-forest text-white shadow-none">View profile</Button>
                </div>
              </article>
              <div className="grid gap-10">
                {list.slice(1).map((learner) => (
                  <article key={learner.id}>
                    {learner.publicImage && (
                      <Link href={`/sponsor/${learner.id}`} className="group relative block aspect-[1.35] overflow-hidden bg-mist">
                        <Image src={learner.image} alt="" fill className="motion-scale object-cover group-hover:scale-[1.03]" sizes="30vw" />
                      </Link>
                    )}
                    <div className={learner.publicImage ? 'pt-4' : ''}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand">{learner.level} · {learner.location}</p>
                      <h2 className="mt-2 text-xl font-semibold">
                        <Link href={`/sponsor/${learner.id}`} className="transition-colors hover:text-brand">{learner.displayName}&apos;s learning journey</Link>
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-sage">{learner.storyVisible ? learner.story : 'This story is kept private.'}</p>
                      <p className="mt-3 text-sm font-medium">Needs: {learner.needs}</p>
                      <div className="mt-3"><CampaignProgress raised={learner.raised} target={learner.target} /></div>
                      <p className="mt-2 text-xs text-sage">{formatUGX(learner.raised)} of {formatUGX(learner.target)}</p>
                      <Button nativeButton={false} render={<Link href={`/sponsor/${learner.id}`} />} className="mt-4 rounded-full bg-forest text-white shadow-none">View profile</Button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </Flow>
      </Band>
    </SiteShell>
  )
}
