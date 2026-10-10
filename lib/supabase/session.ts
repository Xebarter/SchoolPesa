import { accountName, accountPhoto } from '@/lib/supabase/account'
import { createServerClient } from '@/lib/supabase/server'

export async function currentAccount() {
  const supabase = await createServerClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return null
  return {
    id: user.id,
    email: user.email ?? '',
    name: accountName(user.user_metadata, user.email),
    phone: typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : '',
    photo: accountPhoto(user.user_metadata),
    createdAt: user.created_at ?? '',
    provider: typeof user.app_metadata?.provider === 'string' ? user.app_metadata.provider : 'email',
  }
}
