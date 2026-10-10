import { DashboardShell } from '@/components/dashboard/shell'
import { donorNotifications } from '@/lib/donor'
import { currentAccount } from '@/lib/supabase/session'

export const metadata = { title: 'Dashboard' }

export default async function Layout({ children }: { children: React.ReactNode }) {
  const account = await currentAccount()
  const notifications = account ? donorNotifications(account.email) : []
  return <DashboardShell notifications={notifications} accountName={account?.name ?? 'Donor'}>{children}</DashboardShell>
}
