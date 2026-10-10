import { FinancePanel } from '@/components/admin/finance-panel'
import { getCampaigns, getDonations, getExpenses } from '@/lib/data'

export const metadata = { title: 'Admin finance' }

export default function Page() {
  const campaigns = getCampaigns()
    .filter((item) => item.status !== 'draft')
    .map((item) => ({ id: item.id, title: item.title, raised: item.raised, target: item.target, status: item.status }))
  const donations = getDonations()
  const confirmed = donations.filter((item) => item.status === 'Successful')
  return (
    <FinancePanel
      expenses={getExpenses()}
      campaigns={campaigns}
      confirmedGifts={confirmed.reduce((sum, item) => sum + item.amount, 0)}
      giftCount={confirmed.length}
    />
  )
}
