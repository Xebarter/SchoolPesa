import { CampaignManager } from '@/components/admin/campaign-manager'
import { getBeneficiaries, getCampaigns } from '@/lib/data'

export const metadata = { title: 'Admin campaigns' }

export default function Page() {
  const beneficiaries = getBeneficiaries().map((item) => ({ id: item.id, name: item.displayName }))
  return <CampaignManager initial={getCampaigns()} beneficiaries={beneficiaries} />
}
