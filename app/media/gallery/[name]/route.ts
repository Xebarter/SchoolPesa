import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const mime: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params
  if (!/^[a-z0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(name)) return new NextResponse(null, { status: 404 })
  const { data, error } = await createAdminClient().storage.from('gallery').download(name)
  if (error) {
    if (error.statusCode === '404') return new NextResponse(null, { status: 404 })
    throw new Error(`Could not load gallery image: ${error.message}`)
  }
  return new NextResponse(new Uint8Array(await data.arrayBuffer()), {
    headers: {
      'Content-Type': data.type || mime[name.split('.').pop()?.toLowerCase() ?? ''] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
