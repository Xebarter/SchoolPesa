import { GalleryManager } from '@/components/admin/gallery-manager'
import { getGallery } from '@/lib/data'
import { galleryUsage } from '@/lib/gallery-images'

export const metadata = { title: 'Admin gallery' }

export default async function Page() {
  const initial = await getGallery()
  const usage = await galleryUsage(initial)
  return <GalleryManager initial={initial} usage={usage} />
}
