import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { galleryPhoto, removeGalleryObject, replacePhotoSrc } from '@/lib/gallery-images'
import { createAdminClient } from '@/lib/supabase/admin'
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
    const storage = createAdminClient().storage.from('gallery')

    if (purpose === 'cover') {
      const entity = formData.get('entity')
      if (entity !== 'campaign' && entity !== 'story') throw new Error('Choose a supported image type.')
      const file = imageFile(formData.get('image'), 8 * 1024 * 1024, 'a cover image')
      const name = `${entity}-${randomUUID()}.${imageTypes[file.type]}`
      const { error } = await storage.upload(name, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      })
      if (error) throw new Error(`Could not upload cover image: ${error.message}`)
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
          contentType: file.type,
          caption: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Photo',
          content: Buffer.from(await file.arrayBuffer()),
        }
      }))

      const uploaded: string[] = []
      try {
        for (const upload of uploads) {
          const { error } = await storage.upload(upload.name, upload.content, {
            contentType: upload.contentType,
            upsert: false,
          })
          if (error) throw new Error(`Could not upload gallery image: ${error.message}`)
          uploaded.push(upload.name)
        }
        const { error } = await createAdminClient().from('gallery').insert(uploads.map((upload) => ({
          id: upload.id, src: upload.src, alt: upload.caption, caption: upload.caption,
          category, campaign_id: null, story_id: null,
        })))
        if (error) throw new Error(`Could not save gallery photos: ${error.message}`)
      } catch (error) {
        if (uploaded.length) {
          const { error: cleanupError } = await storage.remove(uploaded)
          if (cleanupError) {
            const message = error instanceof Error ? error.message : 'The gallery photos could not be saved.'
            throw new Error(`${message} Cleanup also failed: ${cleanupError.message}`)
          }
        }
        throw error
      }
      revalidatePath('/gallery')
      revalidatePath('/admin/gallery')
      return NextResponse.json({ count: uploads.length })
    }

    if (purpose === 'gallery-replace') {
      const itemId = formData.get('itemId')
      if (typeof itemId !== 'string' || !itemId) throw new Error('Choose a gallery image to replace.')
      const photo = await galleryPhoto(itemId)
      if (!photo) throw new Error('Photo was not found.')
      const file = imageFile(formData.get('photo'), 8 * 1024 * 1024, 'an image')
      const name = `g-${randomUUID()}.${imageTypes[file.type]}`
      const { error: uploadError } = await storage.upload(name, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      })
      if (uploadError) throw new Error(`Could not upload replacement image: ${uploadError.message}`)
      const nextSrc = `/media/gallery/${name}`
      await replacePhotoSrc(photo.src, nextSrc)
      const { data, error } = await createAdminClient().from('gallery').update({ src: nextSrc }).eq('id', photo.id).select('id')
      if (error) throw new Error(`Could not update gallery photo: ${error.message}`)
      if (!data?.length) throw new Error('Photo was not found.')
      const { data: stillUsed, error: referenceError } = await createAdminClient().from('gallery').select('id').eq('src', photo.src).limit(1)
      if (referenceError) throw new Error(`Could not check remaining gallery photo references: ${referenceError.message}`)
      if (!stillUsed?.length) await removeGalleryObject(photo.src)
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
