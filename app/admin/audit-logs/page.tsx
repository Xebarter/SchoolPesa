import { PageIntro, Panel, StatusPill } from '@/components/admin/ui'
import { auditLogs } from '@/lib/data'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'Audit logs' }

export default function Page() {
  return (
    <div>
      <PageIntro title="Audit log" description="Who changed campaigns, expenses and organization details." />
      <Panel className="mt-6" title="Activity" description={`${auditLogs.length} recorded events`}>
        <ol className="divide-y divide-line">
          {auditLogs.map((item) => (
            <li key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[8rem_1fr_auto] sm:items-center">
              <div>
                <p className="text-sm font-semibold text-ink">{formatDate(item.date)}</p>
                <p className="text-xs text-sage">{item.time}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{item.details}</p>
                <p className="mt-1 text-xs text-sage">{item.user} · {item.resource}</p>
              </div>
              <StatusPill value={item.action} />
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  )
}
