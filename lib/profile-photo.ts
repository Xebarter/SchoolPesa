'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { avatarObjectPath } from '@/lib/supabase/avatar-storage'
import { createServerClient } from '@/lib/supabase/server'
import { currentAccount } from '@/lib/supabase/session'

export async function clearProfilePhoto() {
  const account = await currentAccount()
  if (!account?.id) throw new Error('Sign in to update your photo.')
  if (!/^[0-9a-f-]{36}$/i.test(account.id)) throw new Error('That account cannot store a photo.')
  const supabase = await createServerClient()
  if (!supabase) throw new Error('Sign-in is not configured yet.')
  const { data, error: userError } = await supabase.auth.getUser()
  if (userError || !data.user) throw new Error(userError?.message || 'Sign in to update your photo.')

  const metadata = data.user.user_metadata
  const previousPath = avatarObjectPath(metadata?.avatar_path, account.id)
  const picture = metadata?.picture
  const next = typeof picture === 'string' ? picture : ''
  const { error } = await supabase.auth.updateUser({ data: { avatar_url: next, avatar_path: null } })
  if (error) throw new Error(error.message)
  if (previousPath) {
    const { error: removeError } = await createAdminClient().storage.from('avatars').remove([previousPath])
    if (removeError) throw new Error(`Profile photo was cleared, but its stored image could not be removed: ${removeError.message}`)
  }
  return next
}
