'use server'

import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { accountPhoto } from '@/lib/supabase/account'
import { createServerClient } from '@/lib/supabase/server'
import { currentAccount } from '@/lib/supabase/session'

const types: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

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

export async function saveProfilePhoto(formData: FormData) {
  const account = await currentAccount()
  if (!account?.id) throw new Error('Sign in to update your photo.')
  const file = formData.get('photo')
  if (!(file instanceof File) || file.size === 0) throw new Error('Choose an image.')
  if (file.size > 2 * 1024 * 1024) throw new Error('Use an image smaller than 2 MB.')
  const extension = types[file.type]
  if (!extension) throw new Error('Use a JPG, PNG, or WebP image.')
  const id = safeId(account.id)
  const dir = avatarDir()
  await mkdir(dir, { recursive: true })
  await removeStored(id)
  await writeFile(join(dir, `${id}.${extension}`), Buffer.from(await file.arrayBuffer()))
  const supabase = await createServerClient()
  if (!supabase) throw new Error('Sign-in is not configured yet.')
  const { data } = await supabase.auth.getUser()
  const metadata = data.user?.user_metadata
  const current = accountPhoto(metadata)
  const picture = typeof metadata?.picture === 'string' && metadata.picture.trim()
    ? metadata.picture
    : current.startsWith('http') ? current : ''
  const { error } = await supabase.auth.updateUser({ data: { avatar_url: `/avatars/${id}?v=${Date.now()}`, picture } })
  if (error) throw new Error(error.message)
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
