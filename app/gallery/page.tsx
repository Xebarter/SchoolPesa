import { GalleryGrid } from '@/components/gallery-grid'
import { PageHeader } from '@/components/page-header'
import { Band, Flow } from '@/components/site/flow'
import { SiteShell } from '@/components/site/shell'
import { getGallery } from '@/lib/data'

export const metadata = { title: 'Gallery' }

export default function Page() {
  const gallery = getGallery()
  return (
    <SiteShell>
      <Band>
        <Flow className="py-16 lg:py-24">
          <PageHeader layout="split" eyebrow="In the classroom" title="Gallery" text="Photographs from classrooms, supplies and community days. Click a photo to view it." />
          <div className="mt-12"><GalleryGrid items={gallery} /></div>
        </Flow>
      </Band>
    </SiteShell>
  )
}
