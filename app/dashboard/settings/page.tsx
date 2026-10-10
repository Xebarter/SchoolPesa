import { SettingsForm } from '@/components/dashboard/settings-form'
import { donorPreferences } from '@/lib/donor'
import { currentAccount } from '@/lib/supabase/session'

export const metadata = { title: 'Settings' }

export default async function Page() {
  const account = await currentAccount()
  if (!account) return null
  return (
    <SettingsForm
      account={{
        name: account.name,
        email: account.email,
        phone: account.phone,
        photo: account.photo,
        createdAt: account.createdAt,
        provider: account.provider,
      }}
      preferences={donorPreferences(account.email)}
    />
  )
}
