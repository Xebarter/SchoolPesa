import { Metric, PageIntro, StatusPill, TableFrame, tdClass, thClass, trClass } from '@/components/admin/ui'
import { DonationsTable } from '@/components/dashboard/donations-table'
import { donations, transactions } from '@/lib/data'
import { formatUGX } from '@/lib/format'

export const metadata = { title: 'Admin donations' }

export default function Page() {
  const successful = donations.filter((item) => item.status === 'Successful').reduce((sum, item) => sum + item.amount, 0)
  const pending = donations.filter((item) => item.status === 'Pending' || item.status === 'Processing').length
  return (
    <div>
      <PageIntro title="Donations" description="Filter gifts by status and payment method. Nothing here charges a donor." />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Metric label="Gifts on record" value={String(donations.length)} />
        <Metric label="Successful total" value={formatUGX(successful)} />
        <Metric label="Awaiting review" value={String(pending)} hint="Pending or processing" />
      </div>
      <div className="mt-6">
        <DonationsTable donations={donations} />
      </div>
      <h2 className="mt-10 text-sm font-semibold text-ink">Payment references</h2>
      <p className="mt-1 mb-4 text-xs text-sage">Prepared references only. A provider is not connected.</p>
      <TableFrame>
        <table className="w-full min-w-[36rem] text-left">
          <thead className="border-b border-line bg-[#f7faf8]">
            <tr>{['Reference', 'Provider', 'Amount', 'Status'].map((heading) => <th key={heading} className={thClass}>{heading}</th>)}</tr>
          </thead>
          <tbody>
            {transactions.map((item) => (
              <tr key={item.id} className={trClass}>
                <td className={`${tdClass} font-mono text-xs`}>{item.reference}</td>
                <td className={tdClass}>{item.provider}</td>
                <td className={`${tdClass} font-semibold`}>{formatUGX(item.amount)}</td>
                <td className={tdClass}><StatusPill value={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableFrame>
    </div>
  )
}
