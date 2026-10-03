'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { PageIntro, Panel } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import type { GalleryItem } from '@/lib/types'

const categories = ['All', 'Children', 'Schools', 'Learning', 'School Supplies', 'Scholarships', 'Events', 'Communities']

export function GalleryManager({ initial }: { initial: GalleryItem[] }) {
  const [items, setItems] = useState(initial)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('All')
  const [caption, setCaption] = useState('')
  const [alt, setAlt] = useState('')
  const [relatedCampaign, setRelatedCampaign] = useState('camp-1')
  const [relatedStory, setRelatedStory] = useState('st-1')
  const visible = useMemo(() => items.filter((item) => (category === 'All' || item.category === category) && item.caption.toLowerCase().includes(q.toLowerCase())), [items, q, category])

  return (
    <div>
      <PageIntro title="Gallery" description={`${items.length} photos in the library. Captions, alt text and related records stay with each image.`} />
      <Panel title="Add a photo" className="mt-6" padded>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => {
          event.preventDefault()
          setItems((current) => [{ id: `g-${Date.now()}`, src: '/school-pesa-hero.png', alt: alt || caption, caption: caption || 'New photo', category: category === 'All' ? 'Learning' : category, campaignId: relatedCampaign, storyId: relatedStory }, ...current])
          setCaption('')
          setAlt('')
        }}>
          <Label>Caption<Input className="mt-2" value={caption} onChange={(event) => setCaption(event.target.value)} /></Label>
          <Label>Alt text<Input className="mt-2" value={alt} onChange={(event) => setAlt(event.target.value)} /></Label>
          <Label>Related campaign<Input className="mt-2" value={relatedCampaign} onChange={(event) => setRelatedCampaign(event.target.value)} /></Label>
          <Label>Related story<Input className="mt-2" value={relatedStory} onChange={(event) => setRelatedStory(event.target.value)} /></Label>
          <Button type="submit" className="rounded-full bg-forest">Upload to library</Button>
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
          <article key={item.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm shadow-forest/5">
            <div className="relative aspect-[4/3] bg-mist">
              <Image src={item.src} alt={item.alt} fill className="object-cover" />
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-forest">{item.category}</span>
            </div>
            <div className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold text-ink">{item.caption}</p>
                <p className="mt-1 text-xs text-sage">{item.alt}</p>
              </div>
              <button type="button" className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-brand hover:bg-[#f8ece8]" onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
