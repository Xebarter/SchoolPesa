'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { PageIntro, Panel } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { updateGalleryItem } from '@/lib/admin-actions'
import { createGalleryItem, deleteGalleryItem } from '@/lib/actions'
import type { GalleryItem } from '@/lib/types'

const categories = ['All', 'Children', 'Schools', 'Learning', 'School Supplies', 'Scholarships', 'Events', 'Communities']

export function GalleryManager({ initial }: { initial: GalleryItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('All')
  const [caption, setCaption] = useState('')
  const [alt, setAlt] = useState('')
  const [photoCategory, setPhotoCategory] = useState('Learning')
  const [relatedCampaign, setRelatedCampaign] = useState('')
  const [relatedStory, setRelatedStory] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { setItems(initial) }, [initial])
  const visible = useMemo(() => items.filter((item) => (category === 'All' || item.category === category) && item.caption.toLowerCase().includes(q.toLowerCase())), [items, q, category])

  return (
    <div>
      <PageIntro title="Gallery" description={`${items.length} photos in the library. Captions, alt text and related records stay with each image.`} />
      <Panel title={editing ? 'Edit photo' : 'Add a photo'} className="mt-6" padded>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => {
          event.preventDefault()
          setError('')
          const payload = { alt: alt || caption, caption: caption || 'New photo', category: photoCategory, campaignId: relatedCampaign || undefined, storyId: relatedStory || undefined }
          const work = editing ? updateGalleryItem(editing, payload) : createGalleryItem(payload)
          void work.then(() => {
            setCaption('')
            setAlt('')
            setEditing(null)
            router.refresh()
          }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'The photo could not be saved.'))
        }}>
          <Label>Caption<Input className="mt-2" value={caption} onChange={(event) => setCaption(event.target.value)} /></Label>
          <Label>Alt text<Input className="mt-2" value={alt} onChange={(event) => setAlt(event.target.value)} /></Label>
          <Label>Category
            <Select className="mt-2" value={photoCategory} onChange={(event) => setPhotoCategory(event.target.value)}>
              {categories.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}
            </Select>
          </Label>
          <Label>Related campaign<Input className="mt-2" value={relatedCampaign} onChange={(event) => setRelatedCampaign(event.target.value)} placeholder="Campaign id" /></Label>
          <Label>Related story<Input className="mt-2" value={relatedStory} onChange={(event) => setRelatedStory(event.target.value)} placeholder="Story id" /></Label>
          {error ? <p className="text-sm text-destructive md:col-span-2" role="alert">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" className="rounded-full bg-forest">{editing ? 'Update photo' : 'Upload to library'}</Button>
            {editing ? <Button type="button" variant="outline" className="rounded-full" onClick={() => { setEditing(null); setCaption(''); setAlt('') }}>Cancel</Button> : null}
          </div>
        </form>
      </Panel>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Input aria-label="Search gallery" className="sm:max-w-xs" placeholder="Search captions" value={q} onChange={(event) => setQ(event.target.value)} />
        <Select aria-label="Category" className="sm:max-w-xs" value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </Select>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((item) => (
          <article key={item.id} className="overflow-hidden bg-mist">
            <div className="relative aspect-[4/3] bg-mist">
              <Image src={item.src} alt={item.alt} fill className="object-cover" />
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-forest">{item.category}</span>
            </div>
            <div className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold text-ink">{item.caption}</p>
                <p className="mt-1 text-xs text-sage">{item.alt}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" className="rounded-full px-2.5 py-1 text-xs font-semibold text-forest hover:bg-cream" onClick={() => { setEditing(item.id); setCaption(item.caption); setAlt(item.alt); setPhotoCategory(item.category); setRelatedCampaign(item.campaignId ?? ''); setRelatedStory(item.storyId ?? '') }}>Edit</button>
                <button type="button" className="rounded-full px-2.5 py-1 text-xs font-semibold text-brand hover:bg-cream" onClick={() => { void deleteGalleryItem(item.id).then(() => router.refresh()) }}>Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
