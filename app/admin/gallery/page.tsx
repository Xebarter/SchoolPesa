import { GalleryManager } from '@/components/admin/gallery-manager'
import { getGallery } from '@/lib/data'
import { galleryUsage } from '@/lib/gallery-images'

export const metadata = { title: 'Admin gallery' }

export default function Page() {
  const initial = getGallery()
  return <GalleryManager initial={initial} usage={galleryUsage(initial)} />
}
