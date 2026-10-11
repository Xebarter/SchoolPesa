import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { avatarObjectPath } from '@/lib/supabase/avatar-storage'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse(null, { status: 404 })
  const supabase = await createServerClient()
  if (!supabase) return new NextResponse(null, { status: 404 })
  const { data, error: authError } = await supabase.auth.getUser()
  if (authError || !data.user || data.user.id !== id) return new NextResponse(null, { status: 404 })
  const path = avatarObjectPath(data.user.user_metadata?.avatar_path, id)
  if (!path) return new NextResponse(null, { status: 404 })

  const { data: image, error } = await createAdminClient().storage.from('avatars').download(path)
  if (error) {
    if (error.statusCode === '404') return new NextResponse(null, { status: 404 })
    throw new Error(`Could not load profile photo: ${error.message}`)
  }
  return new NextResponse(new Uint8Array(await image.arrayBuffer()), {
    headers: {
      'Content-Type': image.type || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
