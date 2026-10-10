import { NotificationInbox } from '@/components/dashboard/notification-inbox'
import { donorNotifications } from '@/lib/donor'
import { currentAccount } from '@/lib/supabase/session'

export const metadata = { title: 'Notifications' }

export default async function Page() {
  const account = await currentAccount()
  const notifications = account ? donorNotifications(account.email) : []
  return (
    <div className="mx-auto max-w-6xl">
      <NotificationInbox items={notifications} />
    </div>
  )
}
