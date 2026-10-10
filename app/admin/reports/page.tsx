import { ReportsBoard } from '@/components/admin/reports-board'
import { getBeneficiaries, getCampaigns, getDonations, getExpenses, getImpact } from '@/lib/data'

export const metadata = { title: 'Admin reports' }

export default function Page() {
  return <ReportsBoard donations={getDonations()} campaigns={getCampaigns()} expenses={getExpenses()} beneficiaries={getBeneficiaries()} impact={getImpact()} />
}
