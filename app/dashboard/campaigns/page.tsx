import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { PageIntro, StatusPill } from '@/components/admin/ui'
import { CampaignProgress } from '@/components/campaign-progress'
import { campaigns } from '@/lib/data'
import { formatUGX, percentOf } from '@/lib/format'

export const metadata = { title: 'My campaigns' }

export default function Page() {
  const supported = campaigns.filter((item) => ['camp-1', 'camp-2', 'camp-3'].includes(item.id))
  return (
    <div>
      <PageIntro title="My campaigns" description="Causes you have supported, with progress toward each goal.">
        <Link href="/campaigns" className="rounded-full border border-line bg-white px-3.5 py-2 text-xs font-semibold text-forest hover:bg-mist">Browse all campaigns</Link>
      </PageIntro>
      <ul className="mt-6 grid gap-4">
        {supported.map((item) => {
          const percent = percentOf(item.raised, item.target)
          return (
            <li key={item.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm shadow-forest/5">
              <div className="grid sm:grid-cols-[11rem_1fr]">
                <div className="relative min-h-40 bg-mist">
                  <Image src={item.image} alt="" fill className="object-cover" sizes="176px" />
                </div>
                <div className="flex flex-col gap-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{item.category} · {item.location}</p>
                      <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">
                        <Link href={`/campaigns/${item.slug}`} className="hover:text-forest">{item.title}</Link>
                      </h2>
                    </div>
                    <StatusPill value={item.status} />
                  </div>
                  <p className="text-sm leading-6 text-sage">{item.summary}</p>
                  <div>
                    <CampaignProgress raised={item.raised} target={item.target} />
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink">{formatUGX(item.raised)} <span className="font-normal text-sage">of {formatUGX(item.target)}</span></span>
                      <span className="text-sage">{percent}% · {item.donors} donors</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/campaigns/${item.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-forest">
                      View campaign <ArrowUpRight className="size-3.5" />
                    </Link>
                    <Link href={`/donate?campaign=${item.slug}`} className="text-xs font-semibold text-brand">Give again</Link>
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
