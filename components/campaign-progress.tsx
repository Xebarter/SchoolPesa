import { percentOf } from '@/lib/format'

export function CampaignProgress({ raised, target }: { raised: number; target: number }) {
  const percent = percentOf(raised, target)
  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Funding progress">
        <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
