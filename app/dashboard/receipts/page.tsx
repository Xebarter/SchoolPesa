import { DonationsTable } from '@/components/dashboard/donations-table'
import { donations } from '@/lib/data'

export const metadata = { title: 'Receipts' }

export default function Page() {
  const ready = donations.filter((item) => item.status === 'Successful')
  return (
    <div>
      <h1 className="text-3xl font-semibold">Receipts</h1>
      <p className="mt-2 mb-6 text-sm text-sage">Successful gifts are ready for a receipt file.</p>
      <DonationsTable donations={ready} donorView />
    </div>
  )
}
