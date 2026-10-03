import { Metric, Panel, PageIntro, StatusPill } from '@/components/admin/ui'
import { CampaignBars, DonationsArea, LevelDonut } from '@/components/charts'
import { SampleNote } from '@/components/states'
import { auditLogs, campaignBars, donationSeries, donations, impactStats, levelSplit } from '@/lib/data'
import { formatDate, formatUGX } from '@/lib/format'

export default function Page() {
  return (
    <div>
      <PageIntro title="Overview" description="Fundraising activity across campaigns, gifts and learners.">
        <SampleNote />
      </PageIntro>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total raised" value={formatUGX(impactStats.fundsRaised)} />
        <Metric label="This month" value={formatUGX(impactStats.thisMonth)} />
        <Metric label="Active campaigns" value={String(impactStats.activeCampaigns)} />
        <Metric label="Children supported" value={impactStats.childrenSupported.toLocaleString()} />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel title="Donations over time" className="xl:col-span-2" padded>
          <DonationsArea data={donationSeries} />
        </Panel>
        <Panel title="Education support" padded>
          <LevelDonut data={levelSplit} />
        </Panel>
        <Panel title="Donations by campaign" className="xl:col-span-3" padded>
          <CampaignBars data={campaignBars} />
        </Panel>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Recent donations">
          <ul className="divide-y divide-line">
            {donations.slice(0, 5).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.anonymous ? 'Anonymous' : item.donorName}</p>
                  <p className="text-xs text-sage">{formatUGX(item.amount)}</p>
                </div>
                <StatusPill value={item.status} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent campaign activity">
          <ol className="divide-y divide-line">
            {auditLogs.map((item) => (
              <li key={item.id} className="px-5 py-3.5">
                <p className="text-sm font-medium text-ink">{item.details}</p>
                <p className="mt-1 text-xs text-sage">{item.user} · {formatDate(item.date)} · {item.time}</p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  )
}
