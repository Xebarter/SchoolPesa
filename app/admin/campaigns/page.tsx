import { CampaignManager } from '@/components/admin/campaign-manager'
import { getAllBeneficiaries, getAllCampaigns } from '@/lib/data'

export const metadata = { title: 'Admin campaigns' }

export default async function Page() {
  const [campaigns, allBeneficiaries] = await Promise.all([getAllCampaigns(), getAllBeneficiaries()])
  const beneficiaries = allBeneficiaries.map((item) => ({ id: item.id, name: item.displayName }))
  return <CampaignManager initial={campaigns} beneficiaries={beneficiaries} />
}
