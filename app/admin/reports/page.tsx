import { ReportsBoard } from '@/components/admin/reports-board'
import { getAllBeneficiaries, getAllCampaigns, getDonations, getExpenses, getImpact } from '@/lib/data'

export const metadata = { title: 'Admin reports' }

export default async function Page() {
  const [donations, campaigns, expenses, beneficiaries, impact] = await Promise.all([
    getDonations(),
    getAllCampaigns(),
    getExpenses(),
    getAllBeneficiaries(),
    getImpact(),
  ])
  return <ReportsBoard donations={donations} campaigns={campaigns} expenses={expenses} beneficiaries={beneficiaries} impact={impact} />
}
