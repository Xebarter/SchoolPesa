import Image from 'next/image'
import Link from 'next/link'
import { CampaignProgress } from '@/components/campaign-progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatUGX, percentOf } from '@/lib/format'
import type { Campaign } from '@/lib/types'

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const percent = percentOf(campaign.raised, campaign.target)
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
      <Link href={`/campaigns/${campaign.slug}`} className="relative aspect-[1.45] overflow-hidden bg-mist">
        <Image src={campaign.image} alt={campaign.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
        <Badge className="absolute left-4 top-4 bg-white/90">{campaign.level}</Badge>
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">{campaign.category}</p>
          <h3 className="mt-1 text-lg font-semibold text-ink">
            <Link href={`/campaigns/${campaign.slug}`}>{campaign.title}</Link>
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-sage">{campaign.summary}</p>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <CampaignProgress raised={campaign.raised} target={campaign.target} />
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-ink">{formatUGX(campaign.raised)} <span className="font-normal text-sage">of {formatUGX(campaign.target)}</span></span>
            <span className="text-sage">{percent}%</span>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-sage">
            <span>{campaign.donors} donors</span>
            <Button nativeButton={false} render={<Link href={`/donate?campaign=${campaign.slug}`} />} size="sm" className="rounded-full bg-forest text-white shadow-none hover:bg-[#285842]">
              Donate
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
