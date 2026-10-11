import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { avatarObjectPath } from '@/lib/supabase/avatar-storage'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { currentAccount } from '@/lib/supabase/session'

export const runtime = 'nodejs'

const imageTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function POST(request: Request) {
  const account = await currentAccount()
  if (!account?.id || !/^[0-9a-f-]{36}$/i.test(account.id)) {
    return NextResponse.json({ error: 'Sign in to update your photo.' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('photo')
    if (!(file instanceof File) || file.size === 0) throw new Error('Choose an image.')
    if (file.size > 2 * 1024 * 1024) throw new Error('Use an image smaller than 2 MB.')
    const extension = imageTypes[file.type]
    if (!extension) throw new Error('Use a JPG, PNG, or WebP image.')

    const supabase = await createServerClient()
    if (!supabase) throw new Error('Sign-in is not configured yet.')
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user || data.user.id !== account.id) throw new Error(error?.message || 'Sign in to update your photo.')
    const metadata = data.user.user_metadata
    const previousPath = avatarObjectPath(metadata?.avatar_path, account.id)
    const picture = typeof metadata?.picture === 'string' && metadata.picture.trim()
      ? metadata.picture
      : typeof metadata?.avatar_url === 'string' && metadata.avatar_url.startsWith('http') ? metadata.avatar_url : ''
    const objectPath = `${account.id}/${randomUUID()}.${extension}`
    const storage = createAdminClient().storage.from('avatars')
    const { error: uploadError } = await storage.upload(objectPath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    })
    if (uploadError) throw new Error(`Could not store profile photo: ${uploadError.message}`)

    const photo = `/avatars/${account.id}?v=${Date.now()}`
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: photo, picture, avatar_path: objectPath },
    })
    if (updateError) {
      const { error: cleanupError } = await storage.remove([objectPath])
      if (cleanupError) throw new Error(`Could not update profile photo: ${updateError.message}. Cleanup failed: ${cleanupError.message}`)
      throw new Error(updateError.message)
    }

    if (previousPath) {
      const { error: cleanupError } = await storage.remove([previousPath])
      if (cleanupError) throw new Error(`Profile photo was updated, but the previous image could not be removed: ${cleanupError.message}`)
    }
    return NextResponse.json({ photo })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The photo could not be saved.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
