import { GalleryManager } from '@/components/admin/gallery-manager'
import { gallery } from '@/lib/data'

export const metadata = { title: 'Admin gallery' }

export default function Page() {
  return <GalleryManager initial={gallery} />
}
