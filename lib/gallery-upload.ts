'use server'

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/db'

const types: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const categories = new Set(['Children', 'Schools', 'Learning', 'School Supplies', 'Scholarships', 'Events', 'Communities'])

export async function uploadGalleryImages(formData: FormData) {
  const category = String(formData.get('category') || 'Learning')
  if (!categories.has(category)) throw new Error('Choose a category.')
  const files = formData.getAll('photos').filter((item): item is File => item instanceof File && item.size > 0)
  if (files.length === 0) throw new Error('Choose at least one image.')
  if (files.length > 20) throw new Error('Add up to 20 images at a time.')
  const dir = join(process.cwd(), 'data', 'gallery')
  await mkdir(dir, { recursive: true })
  const insert = getDb().prepare('INSERT INTO gallery (id, src, alt, caption, category, campaign_id, story_id) VALUES (?, ?, ?, ?, ?, NULL, NULL)')
  const stamp = Date.now().toString(36)
  for (const [index, file] of files.entries()) {
    const extension = types[file.type]
    if (!extension) throw new Error('Use JPG, PNG, WebP, or GIF images.')
    if (file.size > 8 * 1024 * 1024) throw new Error('Each image must be under 8 MB.')
    const id = `g-${stamp}-${index.toString(36)}`
    const name = `${id}.${extension}`
    await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()))
    const caption = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Photo'
    insert.run(id, `/media/gallery/${name}`, caption, caption, category)
  }
  revalidatePath('/gallery')
  revalidatePath('/admin/gallery')
}
