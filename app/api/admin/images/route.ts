import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { galleryPhoto, replacePhotoSrc } from '@/lib/gallery-images'
import { currentAccount, isAdminRole } from '@/lib/supabase/session'

export const runtime = 'nodejs'

const imageTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
const galleryCategories = new Set(['Children', 'Schools', 'Learning', 'School Supplies', 'Scholarships', 'Events', 'Communities'])
const galleryRevalidationPaths = [
  '/gallery',
  '/admin/gallery',
  '/campaigns',
  '/campaigns/[slug]',
  '/stories',
  '/stories/[slug]',
  '/news',
  '/events',
  '/sponsor',
  '/admin/campaigns',
  '/admin/stories',
]

function imageFile(value: FormDataEntryValue | null, maxSize: number, label: string): File {
  if (!(value instanceof File) || value.size === 0) throw new Error(`Choose ${label}.`)
  if (value.size > maxSize) throw new Error(`Use an image under ${maxSize / (1024 * 1024)} MB.`)
  if (!imageTypes[value.type]) throw new Error('Use a JPG, PNG, WebP, or GIF image.')
  return value
}

function galleryFileName(src: string) {
  if (!src.startsWith('/media/gallery/')) return ''
  const name = src.slice('/media/gallery/'.length).split('?')[0]
  return /^[a-z0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(name) ? name : ''
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'The image upload could not be completed.'
  const status = message === 'Administrator access is required.' ? 403 : 400
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  try {
    const account = await currentAccount()
    if (!account || !isAdminRole(account.role)) {
      return NextResponse.json({ error: 'Administrator access is required.' }, { status: 403 })
    }

    const formData = await request.formData()
    const purpose = formData.get('purpose')
    const directory = join(process.cwd(), 'data', 'gallery')
    await mkdir(directory, { recursive: true })

    if (purpose === 'cover') {
      const entity = formData.get('entity')
      if (entity !== 'campaign' && entity !== 'story') throw new Error('Choose a supported image type.')
      const file = imageFile(formData.get('image'), 8 * 1024 * 1024, 'a cover image')
      const name = `${entity}-${randomUUID()}.${imageTypes[file.type]}`
      await writeFile(join(directory, name), Buffer.from(await file.arrayBuffer()))
      return NextResponse.json({ image: `/media/gallery/${name}` })
    }

    if (purpose === 'gallery-upload') {
      const category = formData.get('category')
      if (typeof category !== 'string' || !galleryCategories.has(category)) throw new Error('Choose a category.')
      const selected = formData.getAll('photos')
      if (selected.length === 0 || selected.length > 20) throw new Error('Choose between 1 and 20 images.')
      const files = selected.map((value) => imageFile(value, 8 * 1024 * 1024, 'an image'))
      const uploads = await Promise.all(files.map(async (file) => {
        const id = `g-${randomUUID()}`
        const name = `${id}.${imageTypes[file.type]}`
        return {
          id,
          name,
          src: `/media/gallery/${name}`,
          caption: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Photo',
          content: Buffer.from(await file.arrayBuffer()),
        }
      }))

      try {
        await Promise.all(uploads.map((upload) => writeFile(join(directory, upload.name), upload.content)))
        const db = getDb()
        const insert = db.prepare('INSERT INTO gallery (id, src, alt, caption, category, campaign_id, story_id) VALUES (?, ?, ?, ?, ?, NULL, NULL)')
        db.exec('BEGIN')
        try {
          for (const upload of uploads) insert.run(upload.id, upload.src, upload.caption, upload.caption, category)
          db.exec('COMMIT')
        } catch (error) {
          db.exec('ROLLBACK')
          throw error
        }
      } catch (error) {
        await Promise.all(uploads.map((upload) => unlink(join(directory, upload.name)).catch(() => undefined)))
        throw error
      }
      revalidatePath('/gallery')
      revalidatePath('/admin/gallery')
      return NextResponse.json({ count: uploads.length })
    }

    if (purpose === 'gallery-replace') {
      const itemId = formData.get('itemId')
      if (typeof itemId !== 'string' || !itemId) throw new Error('Choose a gallery image to replace.')
      const photo = galleryPhoto(itemId)
      if (!photo) throw new Error('Photo was not found.')
      const file = imageFile(formData.get('photo'), 8 * 1024 * 1024, 'an image')
      const name = `g-${randomUUID()}.${imageTypes[file.type]}`
      const path = join(directory, name)
      await writeFile(path, Buffer.from(await file.arrayBuffer()))
      const nextSrc = `/media/gallery/${name}`
      const db = getDb()
      try {
        db.exec('BEGIN')
        try {
          replacePhotoSrc(photo.src, nextSrc)
          db.prepare('UPDATE gallery SET src = ? WHERE id = ?').run(nextSrc, photo.id)
          db.exec('COMMIT')
        } catch (error) {
          db.exec('ROLLBACK')
          throw error
        }
      } catch (error) {
        await unlink(path).catch(() => undefined)
        throw error
      }
      const oldName = galleryFileName(photo.src)
      const stillUsed = db.prepare('SELECT 1 AS n FROM gallery WHERE src = ?').get(photo.src)
      if (!stillUsed && oldName) await unlink(join(directory, oldName)).catch(() => undefined)
      for (const path of galleryRevalidationPaths) {
        if (path.includes('[')) revalidatePath(path, 'page')
        else revalidatePath(path)
      }
      return NextResponse.json({ success: true })
    }

    throw new Error('Choose a supported image upload.')
  } catch (error) {
    return failure(error)
  }
}
