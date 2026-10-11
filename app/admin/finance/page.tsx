import { FinancePanel } from '@/components/admin/finance-panel'
import { getAllCampaigns, getDonations, getExpenses } from '@/lib/data'

export const metadata = { title: 'Admin finance' }

export default async function Page() {
  const [allCampaigns, donations, expenses] = await Promise.all([getAllCampaigns(), getDonations(), getExpenses()])
  const campaigns = allCampaigns
    .filter((item) => item.status !== 'draft')
    .map((item) => ({ id: item.id, title: item.title, raised: item.raised, target: item.target, status: item.status }))
  const confirmed = donations.filter((item) => item.status === 'Successful')
  return (
    <FinancePanel
      expenses={expenses}
      campaigns={campaigns}
      confirmedGifts={confirmed.reduce((sum, item) => sum + item.amount, 0)}
      giftCount={confirmed.length}
    />
  )
}
