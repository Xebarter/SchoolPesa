'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { BookOpen, Bold, Eye, FileText, Heading2, ImagePlus, Italic, Link2, List, Plus, Quote, Search, Upload } from 'lucide-react'
import { StatusPill } from '@/components/admin/ui'
import { StoryBody } from '@/components/story-body'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { ImageUploadProgress } from '@/components/ui/image-upload-progress'
import { uploadWithProgress } from '@/lib/image-upload-client'
import { deleteStory, saveStory, setStoryStatus } from '@/lib/admin-actions'
import { formatDate } from '@/lib/format'
import { wordCount } from '@/lib/story-text'
import type { Story } from '@/lib/types'

type StoryStatus = 'draft' | 'published'
type Option = { id: string; title?: string; name?: string }

const categories = ['Success Stories', 'Scholarships', 'School Requirements', 'Community', 'Students', 'Events']
const field = 'mt-2'

const blank = {
  title: '',
  category: 'Success Stories',
  body: '',
  excerpt: '',
  author: 'School Pesa',
  image: '',
  status: 'draft' as StoryStatus,
  campaignId: '',
  beneficiaryId: '',
}

export function StoryEditor({ initial, campaigns, learners }: { initial: Story[]; campaigns: Option[]; learners: Option[] }) {
  const router = useRouter()
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(blank)
  const [preview, setPreview] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState('')

  useEffect(() => { setRows(initial) }, [initial])
  useEffect(() => {
    if (creating || editing) document.getElementById('story-form')?.scrollIntoView({ block: 'nearest' })
  }, [creating, editing])

  const published = rows.filter((item) => item.status === 'published')
  const drafts = rows.length - published.length
  const views = rows.reduce((sum, item) => sum + item.views, 0)
  const words = wordCount(form.body)
  const minutes = Math.max(1, Math.round(words / 200))
  const filtered = rows.filter((item) => {
    const haystack = `${item.title} ${item.author} ${item.excerpt} ${item.category}`.toLowerCase()
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false
    if (status && item.status !== status) return false
    if (category && item.category !== category) return false
    return true
  })

  function closeForm() {
    setCreating(false)
    setEditing(null)
    setForm(blank)
    setPreview(false)
    setUploadProgress(null)
    setUploadSuccess('')
  }

  function fill(item: Story) {
    setUploadProgress(null)
    setUploadSuccess('')
    setForm({
      title: item.title,
      category: categories.includes(item.category) ? item.category : 'Success Stories',
      body: item.body,
      excerpt: item.excerpt,
      author: item.author,
      image: item.image,
      status: item.status,
      campaignId: item.campaignId ?? '',
      beneficiaryId: item.beneficiaryId ?? '',
    })
  }

  function format(kind: 'bold' | 'italic' | 'heading' | 'quote' | 'list' | 'link') {
    const area = bodyRef.current
    if (!area) return
    const start = area.selectionStart
    const end = area.selectionEnd
    const selected = form.body.slice(start, end)
    const fallback = selected || (kind === 'link' ? 'link text' : 'text')
    let next = fallback
    if (kind === 'bold') next = `**${fallback}**`
    if (kind === 'italic') next = `*${fallback}*`
    if (kind === 'heading') next = `## ${fallback}`
    if (kind === 'quote') next = `> ${fallback}`
    if (kind === 'list') next = (selected || 'First point\nSecond point').split('\n').map((line) => (line.startsWith('- ') ? line : `- ${line}`)).join('\n')
    if (kind === 'link') next = `[${fallback}](https://)`
    const before = form.body.slice(0, start)
    const after = form.body.slice(end)
    const block = kind === 'heading' || kind === 'quote' || kind === 'list'
    const lead = block && before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : ''
    const trail = lead ? '\n\n' : ''
    const body = `${before}${lead}${next}${trail}${after}`
    setForm({ ...form, body })
    const cursor = (before + lead + next).length
    requestAnimationFrame(() => {
      area.focus()
      area.setSelectionRange(cursor, cursor)
    })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    setNotice('')
    try {
      await saveStory({ id: editing ?? undefined, ...form })
      setNotice(editing ? 'Story updated.' : 'Story saved.')
      closeForm()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The story could not be saved.')
    } finally {
      setPending(false)
    }
  }

  async function uploadCover(file?: File) {
    if (!file || uploadingCover) return
    setUploadingCover(true)
    setError('')
    setNotice('')
    setUploadSuccess('')
    const data = new FormData()
    data.set('purpose', 'cover')
    data.set('entity', 'story')
    data.set('image', file)
    try {
      setUploadProgress(0)
      const response = await uploadWithProgress('/api/admin/images', data, setUploadProgress)
      if (typeof response.image !== 'string' || !response.image.startsWith('/media/gallery/')) {
        throw new Error('The server returned an invalid image path.')
      }
      const image = response.image
      setForm((current) => ({ ...current, image }))
      setUploadProgress(null)
      setUploadSuccess('Image uploaded successfully. Save the story to apply it.')
    } catch (caught) {
      setUploadProgress(null)
      setError(caught instanceof Error ? caught.message : 'The cover image could not be uploaded.')
    } finally {
      setUploadingCover(false)
    }
  }

  async function publish(item: Story) {
    setPending(true)
    setError('')
    setNotice('')
    const next = item.status === 'published' ? 'draft' : 'published'
    try {
      await setStoryStatus(item.id, next)
      setNotice(next === 'published' ? 'Story published.' : 'Story moved back to draft.')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The story status could not be changed.')
    } finally {
      setPending(false)
    }
  }

  async function remove(id: string) {
    setPending(true)
    setError('')
    setNotice('')
    try {
      await deleteStory(id)
      setConfirming(null)
      if (editing === id) closeForm()
      setNotice('Story removed.')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The story could not be removed.')
    } finally {
      setPending(false)
    }
  }

  function StoryActions({ item }: { item: Story }) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" className="text-sm font-semibold text-forest" onClick={() => { setEditing(item.id); setCreating(false); fill(item); setPreview(false); setError(''); setNotice('') }}>Edit</button>
        <button type="button" className="text-sm font-semibold text-forest disabled:opacity-60" disabled={pending} onClick={() => void publish(item)}>{item.status === 'published' ? 'Unpublish' : 'Publish'}</button>
        {item.status === 'published' ? <Link href={`/stories/${item.slug}`} className="text-sm font-semibold text-forest">View</Link> : null}
        {confirming === item.id ? (
          <>
            <button type="button" className="text-sm font-semibold text-[#8d4b38] disabled:opacity-60" disabled={pending} onClick={() => void remove(item.id)}>Confirm remove</button>
            <button type="button" className="text-sm font-semibold text-sage" onClick={() => setConfirming(null)}>Keep</button>
          </>
        ) : (
          <button type="button" className="text-sm font-semibold text-[#8d4b38]" onClick={() => setConfirming(item.id)}>Remove</button>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Impact</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-ink sm:mt-3 sm:text-5xl">Stories</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-sage sm:mt-3">Draft impact stories, shape the writing, and publish them to the public site.</p>
        </div>
        <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-60" aria-expanded={creating} disabled={pending || uploadingCover} onClick={() => { setCreating((value) => !value); setEditing(null); setForm(blank); setPreview(false); setError(''); setNotice(''); setUploadSuccess(''); setUploadProgress(null) }}>
          <Plus className="size-4" />
          {creating ? 'Close editor' : 'Write a story'}
        </button>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-4" aria-label="Story summary">
        {[
          { label: 'Published', value: String(published.length), icon: BookOpen, detail: 'Live on the public site' },
          { label: 'Drafts', value: String(drafts), icon: FileText, detail: 'Still being prepared' },
          { label: 'Total stories', value: String(rows.length), icon: BookOpen, detail: 'Across all categories' },
          { label: 'Story views', value: views.toLocaleString('en-UG'), icon: Eye, detail: 'Views across published stories' },
        ].map(({ label, value, icon: Icon, detail }) => (
          <div key={label} className="rounded-xl border border-line bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">{label}</p>
              <Icon className="size-4 text-brand" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-ink tabular-nums sm:text-3xl">{value}</p>
            <p className="mt-1 text-xs text-sage">{detail}</p>
          </div>
        ))}
      </section>

      {(notice || error) ? (
        <p className={`mt-4 border px-4 py-3 text-sm ${error ? 'border-[#e7cfc7] bg-[#f8ece8] text-[#8d4b38]' : 'border-line bg-white text-ink'}`} role={error ? 'alert' : 'status'}>{error || notice}</p>
      ) : null}

      {(creating || editing) ? (
        <form id="story-form" className="mt-6 overflow-hidden rounded-2xl border border-line bg-white" onSubmit={save}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{editing ? 'Editing story' : 'New story'}</p>
              {editing ? <p className="mt-1 max-w-[min(70vw,32rem)] truncate text-xs text-sage">{form.title || 'Untitled story'}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <StatusPill value={form.status} />
              <button type="button" className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-forest hover:bg-cream" aria-pressed={preview} onClick={() => setPreview((value) => !value)}>{preview ? 'Continue editing' : 'Preview story'}</button>
            </div>
          </div>
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem]">
            <div className="min-w-0 px-4 py-5 sm:px-6 sm:py-8">
              {preview ? (
                <article className="mx-auto max-w-2xl">
                  {form.image.startsWith('/') && !form.image.startsWith('//') ? (
                    <div className="relative mb-7 aspect-[16/9] overflow-hidden rounded-xl bg-cream">
                      <Image src={form.image} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 640px" />
                    </div>
                  ) : null}
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{form.category}</p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.04em] text-ink sm:text-4xl">{form.title || 'Your story title'}</h2>
                  <p className="mt-3 text-sm text-sage">{form.author || 'School Pesa'} · {words} words · about {minutes} minute{minutes === 1 ? '' : 's'}</p>
                  {form.excerpt.trim() ? <p className="mt-6 border-l-2 border-brand pl-4 text-base leading-7 text-ink">{form.excerpt}</p> : null}
                  <div className="mt-6 border-t border-line pt-1">
                    {form.body.trim() ? <StoryBody body={form.body} /> : <p className="py-10 text-sm text-sage">Your story text will appear here.</p>}
                  </div>
                </article>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-sage">Story title</span>
                    <input className="w-full rounded-xl border border-line bg-cream/40 px-4 py-3 text-2xl font-semibold tracking-[-.04em] text-ink outline-none placeholder:text-sage/50 focus-visible:ring-2 focus-visible:ring-brand sm:text-3xl" value={form.title} placeholder="Give your story a clear title" onChange={(event) => setForm({ ...form, title: event.target.value })} required />
                  </label>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-sage">
                    <span>{words === 0 ? 'Start writing your story below.' : `${words} words · about ${minutes} minute${minutes === 1 ? '' : 's'} to read`}</span>
                    <span>Use the toolbar to format your story</span>
                  </div>
                  <div className="mt-6 overflow-hidden rounded-xl border border-line">
                    <div className="flex gap-0.5 overflow-x-auto border-b border-line bg-cream px-1.5 py-1.5" role="toolbar" aria-label="Writing tools">
                      <Tool label="Bold" onClick={() => format('bold')}><Bold className="size-4" /></Tool>
                      <Tool label="Italic" onClick={() => format('italic')}><Italic className="size-4" /></Tool>
                      <span className="mx-1 w-px shrink-0 bg-line" aria-hidden />
                      <Tool label="Heading" onClick={() => format('heading')}><Heading2 className="size-4" /></Tool>
                      <Tool label="Quote" onClick={() => format('quote')}><Quote className="size-4" /></Tool>
                      <Tool label="List" onClick={() => format('list')}><List className="size-4" /></Tool>
                      <Tool label="Link" onClick={() => format('link')}><Link2 className="size-4" /></Tool>
                    </div>
                    <Textarea ref={bodyRef} className="min-h-[22rem] rounded-none border-0 bg-transparent px-4 py-4 text-base leading-7 focus-visible:ring-0 sm:min-h-[28rem] sm:px-5" value={form.body} placeholder="Tell the story in your own words. Start with what happened, then share the impact it made." onChange={(event) => setForm({ ...form, body: event.target.value })} required />
                  </div>
                </>
              )}
            </div>
            <aside className="border-t border-line bg-cream/50 px-4 py-5 sm:px-5 lg:border-l lg:border-t-0">
              <div className="grid gap-4">
                <Label>Category
                  <Select className={field} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                    {categories.map((item) => <option key={item}>{item}</option>)}
                  </Select>
                </Label>
                <Label>Status
                  <Select className={field} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as StoryStatus })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </Select>
                </Label>
                <Label>Author<Input className={field} value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} /></Label>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">Cover image</span>
                    <span className="text-[11px] text-sage">Optional</span>
                  </div>
                  <input
                    ref={coverRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    aria-label="Upload story cover image"
                    onChange={(event) => {
                      void uploadCover(event.target.files?.[0])
                      event.target.value = ''
                    }}
                  />
                  {form.image.startsWith('/') && !form.image.startsWith('//') ? (
                    <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-line bg-white">
                      <Image src={form.image} alt="Story cover preview" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 280px" />
                      <span className="absolute bottom-2 left-2 rounded-full bg-ink/75 px-2.5 py-1 text-[10px] font-semibold text-white">Cover preview</span>
                    </div>
                  ) : (
                    <div className="grid aspect-[16/9] place-items-center rounded-xl border border-dashed border-line bg-white text-sage">
                      <div className="text-center">
                        <ImagePlus className="mx-auto size-6" />
                        <p className="mt-2 text-xs">Add a cover photo</p>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-forest transition hover:bg-cream disabled:opacity-60"
                    onClick={() => coverRef.current?.click()}
                    disabled={uploadingCover || pending}
                  >
                    <Upload className="size-4" />
                    {uploadingCover ? 'Uploading…' : form.image ? 'Replace cover image' : 'Upload cover image'}
                  </button>
                  <p className="mt-1.5 text-[11px] leading-5 text-sage">JPG, PNG, WebP, or GIF · up to 8 MB</p>
                  <ImageUploadProgress progress={uploadProgress} success={uploadProgress === null ? uploadSuccess : undefined} />
                  <Label className="mt-3 block">Or use an existing image path
                    <Input className={field} value={form.image} placeholder="/school-pesa-hero.png" onChange={(event) => setForm({ ...form, image: event.target.value })} />
                  </Label>
                </div>
                <Label>Campaign
                  <Select className={field} value={form.campaignId} onChange={(event) => setForm({ ...form, campaignId: event.target.value })}>
                    <option value="">None</option>
                    {campaigns.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </Select>
                </Label>
                <Label>Learner
                  <Select className={field} value={form.beneficiaryId} onChange={(event) => setForm({ ...form, beneficiaryId: event.target.value })}>
                    <option value="">None</option>
                    {learners.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </Select>
                </Label>
                <Label>Excerpt<Input className={field} value={form.excerpt} placeholder="A short summary shown in the story list" onChange={(event) => setForm({ ...form, excerpt: event.target.value })} /></Label>
              </div>
            </aside>
          </div>
          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
            <p className="text-xs text-sage">
              {pending ? 'Saving your story…' : uploadingCover ? 'Uploading your cover…' : !form.title.trim() || !form.body.trim() ? 'Add a title and story text before saving.' : 'Your changes are not saved until you save the story.'}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" className="h-10 rounded-xl px-4 text-sm font-semibold text-sage hover:bg-cream disabled:opacity-60" onClick={closeForm} disabled={pending || uploadingCover}>Cancel</button>
              <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-60" disabled={pending || uploadingCover || !form.title.trim() || !form.body.trim()}>
                {pending ? 'Saving…' : editing ? 'Save changes' : 'Save story'}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="border-b border-line p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Library</h2>
              <p className="mt-1 text-xs text-sage">{filtered.length} of {rows.length}</p>
            </div>
            <label className="relative block sm:w-72">
              <span className="sr-only">Search stories</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sage" />
              <input className="h-11 w-full border border-line bg-cream pl-10 pr-3 text-sm text-ink outline-none placeholder:text-sage/70 focus-visible:ring-2 focus-visible:ring-brand" value={query} placeholder="Title, author, or excerpt" onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip active={!status} onClick={() => setStatus('')}>All</Chip>
            <Chip active={status === 'published'} onClick={() => setStatus('published')}>Published</Chip>
            <Chip active={status === 'draft'} onClick={() => setStatus('draft')}>Drafts</Chip>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip active={!category} onClick={() => setCategory('')}>Any category</Chip>
            {categories.map((item) => <Chip key={item} active={category === item} onClick={() => setCategory(item)}>{item}</Chip>)}
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-sage">{rows.length === 0 ? 'No stories on record yet.' : 'No stories match that search.'}</p>
        ) : (
          <ul className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
            {filtered.map((item) => {
              return (
                <li key={item.id} className="overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-md">
                  <article className="flex h-full flex-col">
                    <div className="relative aspect-[16/9] bg-cream">
                      {item.image.startsWith('/') && !item.image.startsWith('//') ? (
                        <Image src={item.image} alt="" fill className="object-cover" sizes="(max-width: 1280px) 50vw, 33vw" />
                      ) : (
                        <div className="grid size-full place-items-center text-sage"><ImagePlus className="size-7" /></div>
                      )}
                      <div className="absolute left-3 top-3"><StatusPill value={item.status} /></div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand">{item.category}</p>
                      <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-ink">{item.title}</h3>
                      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-sage">{item.excerpt || 'No excerpt added yet.'}</p>
                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3 text-xs text-sage">
                        <span className="truncate">{item.author} · {formatDate(item.date)}</span>
                        <span className="shrink-0">{item.views.toLocaleString('en-UG')} views</span>
                      </div>
                      <StoryActions item={item} />
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Tool({ label, children, onClick }: { label: string; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="grid size-9 shrink-0 place-items-center text-forest hover:bg-white" aria-label={label} title={label} onClick={onClick}>{children}</button>
  )
}

function Chip({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" className={`h-9 shrink-0 rounded-full px-3 text-xs font-semibold transition-colors ${active ? 'bg-brand text-white' : 'border border-line bg-white text-forest hover:bg-cream'}`} onClick={onClick}>{children}</button>
  )
}
