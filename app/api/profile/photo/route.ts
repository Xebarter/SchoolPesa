import { randomUUID } from 'node:crypto'
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NextResponse } from 'next/server'
import { accountPhoto } from '@/lib/supabase/account'
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

    const directory = join(process.cwd(), 'data', 'avatars')
    await mkdir(directory, { recursive: true })
    const name = `${account.id}.${randomUUID()}.${extension}`
    const path = join(directory, name)
    await writeFile(path, Buffer.from(await file.arrayBuffer()))

    const supabase = await createServerClient()
    if (!supabase) {
      await unlink(path)
      throw new Error('Sign-in is not configured yet.')
    }
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      await unlink(path)
      throw new Error(error?.message || 'Sign in to update your photo.')
    }
    const metadata = data.user.user_metadata
    const current = accountPhoto(metadata)
    const picture = typeof metadata?.picture === 'string' && metadata.picture.trim()
      ? metadata.picture
      : current.startsWith('http') ? current : ''
    const photo = `/avatars/${account.id}?v=${Date.now()}`
    const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: photo, picture } })
    if (updateError) {
      await unlink(path)
      throw new Error(updateError.message)
    }

    const existing = await readdir(directory).catch(() => [])
    await Promise.all(existing
      .filter((existingName) => existingName.startsWith(`${account.id}.`) && existingName !== name)
      .map((existingName) => unlink(join(directory, existingName)).catch(() => undefined)))
    return NextResponse.json({ photo })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The photo could not be saved.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
