import { donorNotifications } from '@/lib/donor'
import { currentAccount } from '@/lib/supabase/session'

export async function GET() {
  const account = await currentAccount()
  if (!account?.email) return Response.json({ items: [] })
  return Response.json({ items: donorNotifications(account.email).slice(0, 12) })
}
