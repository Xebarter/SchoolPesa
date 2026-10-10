'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/states'
import type { GalleryItem } from '@/lib/types'

const categories = ['All', 'Children', 'Schools', 'Learning', 'School Supplies', 'Scholarships', 'Events', 'Communities']

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [category, setCategory] = useState('All')
  const [active, setActive] = useState<GalleryItem | null>(null)
  const visible = useMemo(() => (category === 'All' ? items : items.filter((item) => item.category === category)), [category, items])

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Gallery categories">
        {categories.map((item) => (
          <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${category === item ? 'bg-forest text-white' : 'bg-mist text-sage hover:bg-forest hover:text-white'}`}>
            {item}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="mt-8"><EmptyState title="No photos in this category" body="Choose another category to see the gallery." /></div>
      ) : (
        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {visible.map((item) => (
            <button key={item.id} type="button" onClick={() => setActive(item)} className="group mb-8 block w-full text-left">
              <span className="relative block aspect-[4/3] overflow-hidden bg-mist">
                <Image src={item.src} alt={item.alt} fill className="motion-scale object-cover group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 33vw" />
              </span>
              <span className="block pt-3 text-sm">
                <span className="font-semibold text-ink">{item.caption}</span>
                <span className="mt-1 block text-xs text-sage">{item.category}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <Dialog open={Boolean(active)} title={active?.caption ?? 'Photo'} onClose={() => setActive(null)}>
        {active && (
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image src={active.src} alt={active.alt} fill className="object-cover" />
            </div>
            <p className="mt-3 text-sm text-sage">{active.category}</p>
          </div>
        )}
      </Dialog>
    </div>
  )
}
