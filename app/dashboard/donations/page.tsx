import { PageIntro } from '@/components/admin/ui'
import { DonationsTable } from '@/components/dashboard/donations-table'
import { donations } from '@/lib/data'
import { formatUGX } from '@/lib/format'

export const metadata = { title: 'My donations' }

export default function Page() {
  const successful = donations.filter((item) => item.status === 'Successful')
  const total = successful.reduce((sum, item) => sum + item.amount, 0)
  return (
    <div>
      <PageIntro title="My donations" description="Search and filter every gift. Receipts are prepared once a payment provider is connected." />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          [String(donations.length), 'Gifts on record'],
          [String(successful.length), 'Successful'],
          [formatUGX(total), 'Given successfully'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-2xl border border-line bg-white px-5 py-4 shadow-sm shadow-forest/5">
            <p className="text-xl font-semibold tracking-tight text-forest">{value}</p>
            <p className="mt-1 text-xs text-sage">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <DonationsTable donations={donations} donorView />
      </div>
    </div>
  )
}
