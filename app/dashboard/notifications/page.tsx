import { PageIntro } from '@/components/admin/ui'
import { NotificationBoard } from '@/components/dashboard/notification-board'
import { donorNotifications } from '@/lib/donor'
import { currentAccount } from '@/lib/supabase/session'

export const metadata = { title: 'Notifications' }

export default async function Page() {
  const account = await currentAccount()
  const notifications = account ? donorNotifications(account.email) : []
  const unread = notifications.filter((item) => !item.read).length
  return (
    <div>
      <PageIntro title="Notifications" description={unread ? `${unread} unread update${unread === 1 ? '' : 's'} on your account.` : 'Add a reminder, mark one read, or remove it.'} />
      <div className="mt-6">
        <NotificationBoard items={notifications} />
      </div>
    </div>
  )
}
