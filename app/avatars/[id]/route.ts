import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { NextResponse } from 'next/server'

const mime: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse(null, { status: 404 })
  const dir = join(process.cwd(), 'data', 'avatars')
  const files = await readdir(dir).catch(() => [])
  const name = files.find((file) => file.startsWith(`${id}.`))
  if (!name) return new NextResponse(null, { status: 404 })
  const extension = name.split('.').pop() ?? ''
  const body = await readFile(join(dir, name))
  return new NextResponse(body, {
    headers: {
      'Content-Type': mime[extension] ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
