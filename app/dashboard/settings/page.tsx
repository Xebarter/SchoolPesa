import { SettingsForm } from '@/components/dashboard/settings-form'
import { donorEmailUpdates } from '@/lib/donor'
import { currentAccount } from '@/lib/supabase/session'

export const metadata = { title: 'Settings' }

export default async function Page() {
  const account = await currentAccount()
  const emailUpdates = account ? donorEmailUpdates(account.email) : true
  return <SettingsForm emailUpdates={emailUpdates} />
}
