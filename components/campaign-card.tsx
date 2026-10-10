import Image from 'next/image'
import Link from 'next/link'
import { CampaignProgress } from '@/components/campaign-progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatUGX, percentOf } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Campaign } from '@/lib/types'

const statusLabel: Record<string, string> = {
  completed: 'Completed',
  paused: 'Paused',
  draft: 'Draft',
  archived: 'Archived',
}

export function CampaignCard({ campaign, emphasis = false, lead = false, compact = false }: { campaign: Campaign; emphasis?: boolean; lead?: boolean; compact?: boolean }) {
  const percent = percentOf(campaign.raised, campaign.target)
  const status = statusLabel[campaign.status]
  if (compact) {
    return (
      <article className="border border-line bg-white transition-colors duration-200 hover:border-brand">
        <Link href={`/campaigns/${campaign.slug}`} className="group block">
          <span className="relative block aspect-[5/3] overflow-hidden bg-mist">
            <Image src={campaign.image} alt={campaign.title} fill className="motion-scale object-cover group-hover:scale-[1.03]" sizes="(max-width: 1024px) 50vw, 25vw" />
            <Badge className="absolute left-3 top-3 bg-white">{campaign.level}</Badge>
          </span>
          <span className="block px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
            <span className="block text-[11px] font-semibold uppercase tracking-[.16em] text-brand">{campaign.category}</span>
            <h3 className="mt-1.5 line-clamp-2 min-h-12 text-[15px] font-semibold leading-6 tracking-[-.02em] text-ink transition-colors duration-200 group-hover:text-brand">{campaign.title}</h3>
            <span className="mt-4 block"><CampaignProgress raised={campaign.raised} target={campaign.target} /></span>
            <span className="mt-2.5 flex items-baseline justify-between gap-3 text-xs">
              <span className="font-semibold text-ink">{formatUGX(campaign.raised)}</span>
              <span className="text-sage">{percent}% funded</span>
            </span>
          </span>
        </Link>
      </article>
    )
  }
  return (
    <article className={cn('flex flex-col', lead && 'lg:grid lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:gap-12')}>
      <Link href={`/campaigns/${campaign.slug}`} className={cn('group relative overflow-hidden bg-mist', lead ? 'aspect-[1.4] lg:aspect-[1.25]' : emphasis ? 'aspect-[1.15]' : 'aspect-[1.35]')}>
        <Image src={campaign.image} alt={campaign.title} fill className="motion-scale object-cover group-hover:scale-[1.03]" sizes={lead ? '(max-width: 1024px) 100vw, 60vw' : '(max-width: 768px) 100vw, 50vw'} />
        <Badge className="absolute left-4 top-4 bg-cream">{campaign.level}</Badge>
        {status ? <Badge className="absolute right-4 top-4 bg-ink text-white">{status}</Badge> : null}
      </Link>
      <div className={cn('flex flex-1 flex-col gap-4 pt-5', lead && 'lg:pt-0')}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">{campaign.category}</p>
          <h3 className={cn('mt-1 font-semibold tracking-[-.03em] text-ink', lead ? 'text-3xl sm:text-4xl' : emphasis ? 'text-3xl' : 'text-lg')}>
            <Link href={`/campaigns/${campaign.slug}`} className="transition-colors hover:text-brand">{campaign.title}</Link>
          </h3>
          <p className={cn('mt-2 text-sage', lead ? 'text-base leading-7' : 'line-clamp-2 text-sm leading-6')}>{campaign.summary}</p>
          <p className="mt-2 text-xs text-sage">{campaign.location}</p>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <CampaignProgress raised={campaign.raised} target={campaign.target} />
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-ink">{formatUGX(campaign.raised)} <span className="font-normal text-sage">of {formatUGX(campaign.target)}</span></span>
            <span className="text-sage">{percent}%</span>
          </div>
          <div className="flex items-center justify-between pt-3 text-xs text-sage">
            <span>{campaign.donors} donors</span>
            <Button nativeButton={false} render={<Link href={`/donate?campaign=${campaign.slug}`} />} size="sm" className="rounded-full bg-forest text-white shadow-none hover:bg-brand-deep">
              Donate
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
