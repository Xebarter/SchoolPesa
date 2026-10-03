import { GalleryGrid } from '@/components/gallery-grid'
import { PageHeader } from '@/components/page-header'
import { SiteShell } from '@/components/site/shell'
import { gallery } from '@/lib/data'

export const metadata = { title: 'Gallery' }

export default function Page() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <PageHeader eyebrow="In the classroom" title="Gallery" text="Photographs from classrooms, supplies and community days. Click a photo to view it." />
        <div className="mt-10"><GalleryGrid items={gallery} /></div>
      </div>
    </SiteShell>
  )
}
