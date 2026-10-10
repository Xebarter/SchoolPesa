'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Bold, Heading2, Italic, Link2, List, Plus, Quote, Search } from 'lucide-react'
import { StatusPill } from '@/components/admin/ui'
import { StoryBody } from '@/components/story-body'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { deleteStory, saveStory, setStoryStatus } from '@/lib/admin-actions'
import { formatDate } from '@/lib/format'
import { wordCount } from '@/lib/story-text'
import type { Story } from '@/lib/types'

type StoryStatus = 'draft' | 'published'
type Option = { id: string; title?: string; name?: string }

const categories = ['Success Stories', 'Scholarships', 'School Requirements', 'Community', 'Students', 'Events']
const field = 'mt-2 rounded-none'

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
  const [rows, setRows] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(blank)
  const [preview, setPreview] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { setRows(initial) }, [initial])
  useEffect(() => {
    if (creating || editing) document.getElementById('story-form')?.scrollIntoView({ block: 'nearest' })
  }, [creating, editing])

  const published = rows.filter((item) => item.status === 'published')
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
  }

  function fill(item: Story) {
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
        <button type="button" className="inline-flex h-11 items-center justify-center gap-2 bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep" aria-expanded={creating} onClick={() => { setCreating((value) => !value); setEditing(null); setForm(blank); setPreview(false); setError(''); setNotice('') }}>
          <Plus className="size-4" />
          {creating ? 'Close editor' : 'Write a story'}
        </button>
      </header>

      <section className="mt-6 overflow-hidden border border-line bg-forest-deep text-white sm:mt-8 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.9fr)]" aria-label="Story summary">
        <div className="p-5 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Published</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-.045em] tabular-nums sm:text-5xl">{published.length}</p>
          <p className="mt-3 text-sm text-white/60">{rows.length - published.length} still in draft · {views.toLocaleString('en-UG')} views</p>
        </div>
        <div className="grid grid-cols-3 border-t border-white/10 lg:border-t-0 lg:border-l">
          {[
            ['On record', String(rows.length)],
            ['Drafts', String(rows.length - published.length)],
            ['Views', views.toLocaleString('en-UG')],
          ].map(([label, value]) => (
            <div key={label} className="border-r border-white/10 p-4 last:border-r-0 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
              <p className="mt-2 text-lg font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {(notice || error) ? (
        <p className={`mt-4 border px-4 py-3 text-sm ${error ? 'border-[#e7cfc7] bg-[#f8ece8] text-[#8d4b38]' : 'border-line bg-white text-ink'}`} role={error ? 'alert' : 'status'}>{error || notice}</p>
      ) : null}

      {(creating || editing) ? (
        <form id="story-form" className="mt-6 border border-line bg-white" onSubmit={save}>
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{editing ? 'Editing' : 'New story'}</p>
            <button type="button" className="text-xs font-semibold text-forest" aria-pressed={preview} onClick={() => setPreview((value) => !value)}>{preview ? 'Back to draft' : 'Preview'}</button>
          </div>
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem]">
            <div className="min-w-0 px-4 py-5 sm:px-6 sm:py-8">
              <label className="block">
                <span className="sr-only">Title</span>
                <input className="w-full bg-transparent text-3xl font-semibold tracking-[-.04em] text-ink outline-none placeholder:text-sage/50 sm:text-4xl" value={form.title} placeholder="Story title" onChange={(event) => setForm({ ...form, title: event.target.value })} required />
              </label>
              <p className="mt-3 text-xs text-sage">{words === 0 ? 'The manuscript is empty.' : `${words} words · about ${minutes} minute${minutes === 1 ? '' : 's'}`}</p>
              <div className="mt-6 border border-line">
                {preview ? null : (
                  <div className="flex gap-0.5 overflow-x-auto border-b border-line bg-cream px-1.5 py-1.5" role="toolbar" aria-label="Writing tools">
                    <Tool label="Bold" onClick={() => format('bold')}><Bold className="size-4" /></Tool>
                    <Tool label="Italic" onClick={() => format('italic')}><Italic className="size-4" /></Tool>
                    <span className="mx-1 w-px shrink-0 bg-line" aria-hidden />
                    <Tool label="Heading" onClick={() => format('heading')}><Heading2 className="size-4" /></Tool>
                    <Tool label="Quote" onClick={() => format('quote')}><Quote className="size-4" /></Tool>
                    <Tool label="List" onClick={() => format('list')}><List className="size-4" /></Tool>
                    <Tool label="Link" onClick={() => format('link')}><Link2 className="size-4" /></Tool>
                  </div>
                )}
                {preview ? (
                  <div className="min-h-72 bg-cream/40 px-4 py-2 sm:px-6">
                    {form.body.trim() ? <StoryBody body={form.body} /> : <p className="py-10 text-sm text-sage">Nothing to preview yet.</p>}
                  </div>
                ) : (
                  <Textarea ref={bodyRef} className="min-h-72 rounded-none border-0 bg-transparent px-4 py-4 text-base leading-7 focus-visible:ring-0 sm:px-5" value={form.body} placeholder="Write the story. Select words, then use the tools for emphasis, a heading, a quote, a list, or a link." onChange={(event) => setForm({ ...form, body: event.target.value })} required />
                )}
              </div>
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
                <Label>Cover path<Input className={field} value={form.image} placeholder="/school-pesa-hero.png" onChange={(event) => setForm({ ...form, image: event.target.value })} /></Label>
                {form.image.startsWith('/') ? (
                  <div className="relative h-28 overflow-hidden border border-line bg-white">
                    <Image src={form.image} alt="" fill className="object-cover" sizes="280px" />
                  </div>
                ) : null}
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
                <Label>Excerpt<Input className={field} value={form.excerpt} placeholder="Opening line, if you want one" onChange={(event) => setForm({ ...form, excerpt: event.target.value })} /></Label>
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <button type="submit" className="inline-flex h-11 items-center justify-center bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-60" disabled={pending}>{pending ? 'Saving…' : editing ? 'Update story' : 'Save story'}</button>
                <button type="button" className="inline-flex h-11 items-center justify-center text-sm font-semibold text-sage" onClick={closeForm}>Cancel</button>
              </div>
            </aside>
          </div>
        </form>
      ) : null}

      <section className="mt-6 border border-line bg-white">
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
          <div className="mt-4 flex gap-2 overflow-x-auto">
            <Chip active={!status} onClick={() => setStatus('')}>All</Chip>
            <Chip active={status === 'published'} onClick={() => setStatus('published')}>Published</Chip>
            <Chip active={status === 'draft'} onClick={() => setStatus('draft')}>Drafts</Chip>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            <Chip active={!category} onClick={() => setCategory('')}>Any category</Chip>
            {categories.map((item) => <Chip key={item} active={category === item} onClick={() => setCategory(item)}>{item}</Chip>)}
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-sage">{rows.length === 0 ? 'No stories on record yet.' : 'No stories match that search.'}</p>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((item) => {
              const open = openId === item.id
              return (
                <li key={item.id}>
                  <button type="button" className="flex w-full items-stretch text-left hover:bg-cream" aria-expanded={open} onClick={() => setOpenId(open ? null : item.id)}>
                    <span className="relative w-28 shrink-0 self-stretch bg-cream sm:w-44">
                      {item.image.startsWith('/') ? (
                        <Image src={item.image} alt="" fill className="object-cover" sizes="176px" />
                      ) : null}
                    </span>
                    <span className="flex min-h-24 min-w-0 flex-1 flex-col justify-center px-4 py-3 sm:min-h-28 sm:px-5">
                      <span className="text-sm font-semibold leading-5 text-ink sm:text-base">{item.title}</span>
                      <span className="mt-1.5 flex items-center justify-between gap-3">
                        <span className="truncate text-xs text-sage">{item.category} · {formatDate(item.date)} · {item.views.toLocaleString('en-UG')} views</span>
                        <StatusPill value={item.status} />
                      </span>
                    </span>
                  </button>
                  {open ? (
                    <div className="border-t border-line bg-cream px-4 py-4 sm:px-5">
                      {item.excerpt ? <p className="max-w-2xl text-sm leading-6 text-ink">{item.excerpt}</p> : null}
                      <StoryActions item={item} />
                    </div>
                  ) : null}
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
    <button type="button" className={`h-9 shrink-0 px-3 text-xs font-semibold ${active ? 'bg-brand text-white' : 'border border-line bg-white text-forest'}`} onClick={onClick}>{children}</button>
  )
}
