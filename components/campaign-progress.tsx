import { percentOf } from '@/lib/format'

export function CampaignProgress({ raised, target }: { raised: number; target: number }) {
  const percent = percentOf(raised, target)
  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e6ece5]" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
