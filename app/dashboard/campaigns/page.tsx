import { CampaignLinks } from '@/components/dashboard/campaign-links'
import { donorCampaigns } from '@/lib/donor'
import { getCampaigns } from '@/lib/data'
import { currentAccount } from '@/lib/supabase/session'

export const metadata = { title: 'My campaigns' }

export default async function Page() {
  const account = await currentAccount()
  const campaigns = getCampaigns()
  const saved = account ? donorCampaigns(account.email) : []
  return (
    <div className="mx-auto max-w-6xl">
      <CampaignLinks saved={saved} campaigns={campaigns} />
    </div>
  )
}
