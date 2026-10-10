'use server'

import { readdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { createServerClient } from '@/lib/supabase/server'
import { currentAccount } from '@/lib/supabase/session'

function avatarDir() {
  return join(process.cwd(), 'data', 'avatars')
}

function safeId(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('That account cannot store a photo.')
  return id
}

async function removeStored(id: string) {
  const dir = avatarDir()
  const files = await readdir(dir).catch(() => [])
  await Promise.all(files.filter((name) => name.startsWith(`${id}.`)).map((name) => unlink(join(dir, name)).catch(() => undefined)))
}

export async function clearProfilePhoto() {
  const account = await currentAccount()
  if (!account?.id) throw new Error('Sign in to update your photo.')
  await removeStored(safeId(account.id))
  const supabase = await createServerClient()
  if (!supabase) throw new Error('Sign-in is not configured yet.')
  const { data } = await supabase.auth.getUser()
  const picture = data.user?.user_metadata?.picture
  const next = typeof picture === 'string' ? picture : ''
  const { error } = await supabase.auth.updateUser({ data: { avatar_url: next } })
  if (error) throw new Error(error.message)
  return next
}
