'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { PageIntro } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { updateGalleryItem } from '@/lib/admin-actions'
import { deleteGalleryItem, replaceGalleryImage } from '@/lib/actions'
import { uploadGalleryImages } from '@/lib/gallery-upload'
import type { GalleryItem } from '@/lib/types'

const categories = ['All', 'Children', 'Schools', 'Learning', 'School Supplies', 'Scholarships', 'Events', 'Communities']
const photoCategories = categories.filter((item) => item !== 'All')

export function GalleryManager({ initial, usage }: { initial: GalleryItem[]; usage: Record<string, string[]> }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)
  const replaceId = useRef<string | null>(null)
  const [items, setItems] = useState(initial)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [batchCategory, setBatchCategory] = useState('Learning')
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [photoCategory, setPhotoCategory] = useState('Learning')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { setItems(initial) }, [initial])

  const visible = useMemo(() => items.filter((item) => (category === 'All' || item.category === category) && `${item.caption} ${item.alt}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query, category])
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files])
  useEffect(() => () => { previews.forEach((item) => URL.revokeObjectURL(item.url)) }, [previews])

  function addFiles(list: FileList | null) {
    if (!list?.length) return
    const images = [...list].filter((file) => file.type.startsWith('image/'))
    setFiles((current) => [...current, ...images].slice(0, 20))
    setError('')
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  async function upload(event: FormEvent) {
    event.preventDefault()
    if (!files.length || pending) return
    setPending(true)
    setError('')
    const body = new FormData()
    body.set('category', batchCategory)
    files.forEach((file) => body.append('photos', file))
    try {
      await uploadGalleryImages(body)
      setFiles([])
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The photos could not be added.')
    } finally {
      setPending(false)
    }
  }

  async function remove(itemId: string) {
    setError('')
    try {
      await deleteGalleryItem(itemId)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The photo could not be removed.')
    }
  }

  function startReplace(itemId: string) {
    replaceId.current = itemId
    setError('')
    replaceRef.current?.click()
  }

  async function onReplace(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    const itemId = replaceId.current
    event.target.value = ''
    if (!file || !itemId) return
    setPending(true)
    setError('')
    const body = new FormData()
    body.set('photo', file)
    try {
      await replaceGalleryImage(itemId, body)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The photo could not be replaced.')
    } finally {
      setPending(false)
    }
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault()
    if (!editing || pending) return
    setPending(true)
    setError('')
    try {
      await updateGalleryItem(editing, { alt: caption || 'Photo', caption: caption || 'Photo', category: photoCategory })
      setEditing(null)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The photo could not be saved.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <PageIntro title="Gallery" />
      <input ref={replaceRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => void onReplace(event)} />
      <form onSubmit={upload} className="mt-6">
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`grid place-items-center border border-dashed px-6 py-12 text-center ${dragging ? 'border-forest bg-mist' : 'border-line bg-white'}`}
        >
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={(event) => { addFiles(event.target.files); event.target.value = '' }} />
          <p className="text-lg font-semibold tracking-tight text-ink">Drop photos here</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => inputRef.current?.click()}>Choose photos</Button>
            <Select aria-label="Category for new photos" value={batchCategory} onChange={(event) => setBatchCategory(event.target.value)} className="w-44 bg-cream">
              {photoCategories.map((item) => <option key={item}>{item}</option>)}
            </Select>
          </div>
        </div>
        {previews.length > 0 ? (
          <div className="mt-4">
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {previews.map((item) => (
                <li key={item.url} className="relative aspect-square overflow-hidden bg-mist">
                  <img src={item.url} alt="" className="size-full object-cover" />
                  <button type="button" className="absolute right-1 top-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-ink" onClick={() => setFiles((current) => current.filter((file) => file !== item.file))}>Remove</button>
                </li>
              ))}
            </ul>
            <Button className="mt-4 rounded-full bg-forest text-white hover:bg-brand-deep" disabled={pending}>{pending ? 'Adding…' : `Add ${files.length}`}</Button>
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}
      </form>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Input aria-label="Search gallery" className="sm:max-w-xs" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
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
            <div className="p-4">
              {editing === item.id ? (
                <form onSubmit={saveEdit} className="grid gap-3">
                  <Input aria-label="Caption" value={caption} onChange={(event) => setCaption(event.target.value)} />
                  <Select aria-label="Photo category" value={photoCategory} onChange={(event) => setPhotoCategory(event.target.value)}>
                    {photoCategories.map((option) => <option key={option}>{option}</option>)}
                  </Select>
                  <div className="flex gap-3">
                    <Button className="rounded-full bg-forest text-white hover:bg-brand-deep" disabled={pending}>Save</Button>
                    <Button type="button" variant="outline" className="rounded-full" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{item.caption}</p>
                    {(usage[item.id] ?? []).length ? <p className="mt-1 text-xs leading-5 text-sage">Used on {usageLabel(usage[item.id])}</p> : null}
                  </div>
                  <div className="flex shrink-0 gap-3">
                    <button type="button" className="text-xs font-semibold text-forest" onClick={() => { setEditing(item.id); setCaption(item.caption); setPhotoCategory(photoCategories.includes(item.category) ? item.category : 'Learning') }}>Edit</button>
                    <button type="button" className="text-xs font-semibold text-ink" disabled={pending} onClick={() => startReplace(item.id)}>Replace</button>
                    {(usage[item.id] ?? []).length === 0 ? <button type="button" className="text-xs font-semibold text-ink" onClick={() => void remove(item.id)}>Remove</button> : null}
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function usageLabel(uses: string[]) {
  const shown = uses.slice(0, 2).join(', ')
  return uses.length > 2 ? `${shown}, and ${uses.length - 2} more` : shown
}
