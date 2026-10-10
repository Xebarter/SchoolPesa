import { FinancePanel } from '@/components/admin/finance-panel'
import { getCampaigns, getExpenses } from '@/lib/data'

export const metadata = { title: 'Admin finance' }

export default function Page() {
  return <FinancePanel initial={getExpenses()} campaigns={getCampaigns()} />
}
