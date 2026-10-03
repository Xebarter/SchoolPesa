import Image from 'next/image'
import Link from 'next/link'
import { PageIntro, StatusPill } from '@/components/admin/ui'
import { CampaignProgress } from '@/components/campaign-progress'
import { beneficiaries } from '@/lib/data'
import { formatUGX, percentOf } from '@/lib/format'

export const metadata = { title: 'Sponsored children' }

export default function Page() {
  return (
    <div>
      <PageIntro title="Sponsored children" description="Learners connected to your account, and how close each need is to being met.">
        <Link href="/sponsor" className="rounded-full border border-line bg-white px-3.5 py-2 text-xs font-semibold text-forest hover:bg-mist">Sponsor another child</Link>
      </PageIntro>
      <ul className="mt-6 grid gap-4 lg:grid-cols-3">
        {beneficiaries.map((item) => {
          const percent = percentOf(item.raised, item.target)
          return (
            <li key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm shadow-forest/5">
              <div className="relative aspect-[1.5] bg-mist">
                {item.publicImage ? <Image src={item.image} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" /> : null}
                <div className="absolute left-3 top-3"><StatusPill value={item.status} /></div>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{item.level}</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">
                    <Link href={`/sponsor/${item.id}`} className="hover:text-forest">{item.displayName}</Link>
                  </h2>
                  <p className="mt-1 text-xs text-sage">{item.school} · {item.location}</p>
                </div>
                <p className="text-sm leading-6 text-sage">{item.needs}</p>
                <div className="mt-auto">
                  <CampaignProgress raised={item.raised} target={item.target} />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">{formatUGX(item.raised)}</span>
                    <span className="text-sage">{percent}% of {formatUGX(item.target)}</span>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
