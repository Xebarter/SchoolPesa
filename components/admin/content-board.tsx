'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Input, Label, Textarea } from '@/components/ui/input'
import { deleteEvent, deleteFaq, deleteNews, saveEvent, saveFaq, saveNews } from '@/lib/admin-actions'
import { formatDate } from '@/lib/format'
import type { EventItem, Faq, NewsArticle } from '@/lib/types'

type Section = 'news' | 'events' | 'questions'

const pages = [
  ['Home', '/'],
  ['About', '/about'],
  ['Get involved', '/get-involved'],
  ['News', '/news'],
  ['Events', '/events'],
  ['FAQ', '/faq'],
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
]

const field = 'mt-2 rounded-none border-line bg-white'

function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function ContentBoard({ news, events, faqs }: { news: NewsArticle[]; events: EventItem[]; faqs: Faq[] }) {
  const router = useRouter()
  const [section, setSection] = useState<Section>('news')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [article, setArticle] = useState({ title: '', category: '', date: today(), excerpt: '', body: '' })
  const [eventForm, setEventForm] = useState({ name: '', date: today(), time: '', location: '', description: '' })
  const [faqForm, setFaqForm] = useState({ topic: '', question: '', answer: '' })

  const categories = useMemo(() => [...new Set(news.map((item) => item.category).filter(Boolean))], [news])
  const topics = useMemo(() => [...new Set(faqs.map((item) => item.topic).filter(Boolean))], [faqs])
  const upcoming = events.filter((item) => item.date >= today()).length

  const needle = query.trim().toLowerCase()
  const articles = news
    .filter((item) => !filter || item.category === filter)
    .filter((item) => !needle || `${item.title} ${item.excerpt} ${item.category}`.toLowerCase().includes(needle))
    .sort((a, b) => b.date.localeCompare(a.date))
  const calendar = events
    .filter((item) => filter === 'upcoming' ? item.date >= today() : filter === 'past' ? item.date < today() : true)
    .filter((item) => !needle || `${item.name} ${item.location} ${item.description}`.toLowerCase().includes(needle))
    .sort((a, b) => a.date.localeCompare(b.date))
  const questions = faqs
    .filter((item) => !filter || item.topic === filter)
    .filter((item) => !needle || `${item.question} ${item.answer} ${item.topic}`.toLowerCase().includes(needle))
    .sort((a, b) => a.topic.localeCompare(b.topic) || a.question.localeCompare(b.question))

  const shown = section === 'news' ? articles.length : section === 'events' ? calendar.length : questions.length
  const total = section === 'news' ? news.length : section === 'events' ? events.length : faqs.length
  const formOpen = creating || Boolean(editing)

  function choose(next: Section) {
    setSection(next)
    setCreating(false)
    setEditing(null)
    setQuery('')
    setFilter('')
    setOpenId(null)
    setConfirming(null)
    setError('')
  }

  function startNew() {
    setEditing(null)
    setCreating(true)
    setError('')
    setNotice('')
    setArticle({ title: '', category: '', date: today(), excerpt: '', body: '' })
    setEventForm({ name: '', date: today(), time: '', location: '', description: '' })
    setFaqForm({ topic: '', question: '', answer: '' })
  }

  function closeForm() {
    setCreating(false)
    setEditing(null)
  }

  async function run(work: Promise<void>, message: string) {
    setPending(true)
    setError('')
    try {
      await work
      closeForm()
      setNotice(message)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The record could not be saved.')
    } finally {
      setPending(false)
    }
  }

  function onNews(event: FormEvent) {
    event.preventDefault()
    void run(saveNews({ id: editing ?? undefined, ...article }), editing ? 'Article updated.' : 'Article saved.')
  }

  function onEvent(event: FormEvent) {
    event.preventDefault()
    void run(saveEvent({ id: editing ?? undefined, ...eventForm }), editing ? 'Event updated.' : 'Event saved.')
  }

  function onFaq(event: FormEvent) {
    event.preventDefault()
    void run(saveFaq({ id: editing ?? undefined, ...faqForm }), editing ? 'Question updated.' : 'Question saved.')
  }

  async function remove(id: string) {
    setPending(true)
    setError('')
    try {
      if (section === 'news') await deleteNews(id)
      else if (section === 'events') await deleteEvent(id)
      else await deleteFaq(id)
      setConfirming(null)
      setOpenId(null)
      if (editing === id) closeForm()
      setNotice(section === 'news' ? 'Article removed.' : section === 'events' ? 'Event removed.' : 'Question removed.')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The record could not be removed.')
    } finally {
      setPending(false)
    }
  }

  const summary = section === 'news'
    ? 'Articles on the public news page.'
    : section === 'events'
      ? `${upcoming} still ahead on the calendar.`
      : 'Answers on the public FAQ page.'
  const headline = section === 'news' ? news.length : section === 'events' ? events.length : faqs.length
  const action = section === 'news' ? 'New article' : section === 'events' ? 'New event' : 'New question'
  const searchLabel = section === 'news' ? 'Search articles' : section === 'events' ? 'Search events' : 'Search questions'

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Site</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-ink sm:mt-3 sm:text-5xl">Content</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-sage sm:mt-3">News, events, and questions that appear on the public site.</p>
        </div>
        <button type="button" className="inline-flex h-11 items-center justify-center gap-2 bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep" aria-expanded={creating} onClick={() => (formOpen ? closeForm() : startNew())}>
          <Plus className="size-4" />
          {formOpen ? 'Close editor' : action}
        </button>
      </header>

      <section className="mt-6 overflow-hidden border border-line bg-forest-deep text-white sm:mt-8 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.9fr)]" aria-label="Content summary">
        <div className="p-5 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">{section === 'news' ? 'News' : section === 'events' ? 'Events' : 'Questions'}</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-.045em] tabular-nums sm:text-5xl">{headline}</p>
          <p className="mt-3 text-sm text-white/60">{summary}</p>
        </div>
        <div className="grid grid-cols-3 border-t border-white/10 lg:border-l lg:border-t-0">
          {([
            ['news', 'News', String(news.length)],
            ['events', 'Events', String(events.length)],
            ['questions', 'Questions', String(faqs.length)],
          ] as const).map(([key, label, value]) => (
            <button key={key} type="button" className={`border-r border-white/10 p-4 text-left last:border-r-0 sm:p-6 ${section === key ? 'bg-white/10' : 'hover:bg-white/5'}`} aria-pressed={section === key} onClick={() => choose(key)}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
              <p className="mt-2 text-lg font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 border border-line bg-white" aria-label="Site pages">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-ink">Site pages</h2>
          <p className="text-xs text-sage">Open a public page</p>
        </div>
        <ul className="flex gap-2 overflow-x-auto p-3 sm:p-4">
          {pages.map(([title, href]) => (
            <li key={href}>
              <Link href={href} className="inline-flex h-9 items-center border border-line px-3 text-xs font-semibold text-forest hover:bg-cream">{title}</Link>
            </li>
          ))}
        </ul>
      </section>

      {(notice || error) ? (
        <p className={`mt-4 border px-4 py-3 text-sm ${error ? 'border-[#e7cfc7] bg-[#f8ece8] text-[#8d4b38]' : 'border-line bg-white text-ink'}`} role={error ? 'alert' : 'status'}>{error || notice}</p>
      ) : null}

      {formOpen && section === 'news' ? (
        <form className="mt-6 border border-line bg-white" onSubmit={onNews}>
          <EditorHead label={editing ? 'Editing article' : 'New article'} />
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem]">
            <div className="min-w-0 px-4 py-5 sm:px-6 sm:py-8">
              <label className="block">
                <span className="sr-only">Title</span>
                <input className="w-full bg-transparent text-3xl font-semibold tracking-[-.04em] text-ink outline-none placeholder:text-sage/50 sm:text-4xl" value={article.title} placeholder="Article title" required onChange={(event) => setArticle({ ...article, title: event.target.value })} />
              </label>
              <Label className="mt-8 block">Excerpt<Textarea className={field} value={article.excerpt} placeholder="The line that appears on the news list" onChange={(event) => setArticle({ ...article, excerpt: event.target.value })} /></Label>
              <Label className="mt-4 block">Body<Textarea className={`${field} min-h-48`} value={article.body} placeholder="The full article" onChange={(event) => setArticle({ ...article, body: event.target.value })} /></Label>
            </div>
            <aside className="border-t border-line bg-cream/50 px-4 py-5 sm:px-5 lg:border-l lg:border-t-0">
              <Label>Category<Input className={field} value={article.category} placeholder="Campaigns" onChange={(event) => setArticle({ ...article, category: event.target.value })} /></Label>
              <Label className="mt-4 block">Date<Input className={field} type="date" value={article.date} required onChange={(event) => setArticle({ ...article, date: event.target.value })} /></Label>
              <SaveRow pending={pending} editing={Boolean(editing)} label="article" onCancel={closeForm} />
            </aside>
          </div>
        </form>
      ) : null}

      {formOpen && section === 'events' ? (
        <form className="mt-6 border border-line bg-white" onSubmit={onEvent}>
          <EditorHead label={editing ? 'Editing event' : 'New event'} />
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem]">
            <div className="min-w-0 px-4 py-5 sm:px-6 sm:py-8">
              <label className="block">
                <span className="sr-only">Name</span>
                <input className="w-full bg-transparent text-3xl font-semibold tracking-[-.04em] text-ink outline-none placeholder:text-sage/50 sm:text-4xl" value={eventForm.name} placeholder="Event name" required onChange={(event) => setEventForm({ ...eventForm, name: event.target.value })} />
              </label>
              <Label className="mt-8 block">Description<Textarea className={`${field} min-h-40`} value={eventForm.description} placeholder="Who it is for, and what happens" onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })} /></Label>
            </div>
            <aside className="border-t border-line bg-cream/50 px-4 py-5 sm:px-5 lg:border-l lg:border-t-0">
              <Label>Date<Input className={field} type="date" value={eventForm.date} required onChange={(event) => setEventForm({ ...eventForm, date: event.target.value })} /></Label>
              <Label className="mt-4 block">Time<Input className={field} value={eventForm.time} placeholder="10:00 – 12:00" onChange={(event) => setEventForm({ ...eventForm, time: event.target.value })} /></Label>
              <Label className="mt-4 block">Location<Input className={field} value={eventForm.location} placeholder="Kampala" onChange={(event) => setEventForm({ ...eventForm, location: event.target.value })} /></Label>
              <SaveRow pending={pending} editing={Boolean(editing)} label="event" onCancel={closeForm} />
            </aside>
          </div>
        </form>
      ) : null}

      {formOpen && section === 'questions' ? (
        <form className="mt-6 border border-line bg-white" onSubmit={onFaq}>
          <EditorHead label={editing ? 'Editing question' : 'New question'} />
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem]">
            <div className="min-w-0 px-4 py-5 sm:px-6 sm:py-8">
              <label className="block">
                <span className="sr-only">Question</span>
                <input className="w-full bg-transparent text-2xl font-semibold tracking-[-.04em] text-ink outline-none placeholder:text-sage/50 sm:text-3xl" value={faqForm.question} placeholder="The question a donor would ask" required onChange={(event) => setFaqForm({ ...faqForm, question: event.target.value })} />
              </label>
              <Label className="mt-8 block">Answer<Textarea className={`${field} min-h-40`} value={faqForm.answer} required placeholder="A direct answer" onChange={(event) => setFaqForm({ ...faqForm, answer: event.target.value })} /></Label>
            </div>
            <aside className="border-t border-line bg-cream/50 px-4 py-5 sm:px-5 lg:border-l lg:border-t-0">
              <Label>Topic<Input className={field} value={faqForm.topic} required placeholder="Donations" onChange={(event) => setFaqForm({ ...faqForm, topic: event.target.value })} /></Label>
              <SaveRow pending={pending} editing={Boolean(editing)} label="question" onCancel={closeForm} />
            </aside>
          </div>
        </form>
      ) : null}

      <section className="mt-6 border border-line bg-white">
        <div className="border-b border-line p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">{section === 'news' ? 'News' : section === 'events' ? 'Events' : 'Questions'}</h2>
              <p className="mt-1 text-xs text-sage">{shown} of {total}</p>
            </div>
            <label className="relative block sm:w-72">
              <span className="sr-only">{searchLabel}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sage" />
              <input className="h-11 w-full border border-line bg-cream pl-10 pr-3 text-sm text-ink outline-none placeholder:text-sage/70 focus-visible:ring-2 focus-visible:ring-brand" value={query} placeholder={section === 'news' ? 'Title or excerpt' : section === 'events' ? 'Name or place' : 'Question or answer'} onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto">
            <Chip active={!filter} onClick={() => setFilter('')}>All</Chip>
            {section === 'news' ? categories.map((item) => <Chip key={item} active={filter === item} onClick={() => setFilter(item)}>{item}</Chip>) : null}
            {section === 'events' ? (
              <>
                <Chip active={filter === 'upcoming'} onClick={() => setFilter('upcoming')}>Upcoming</Chip>
                <Chip active={filter === 'past'} onClick={() => setFilter('past')}>Past</Chip>
              </>
            ) : null}
            {section === 'questions' ? topics.map((item) => <Chip key={item} active={filter === item} onClick={() => setFilter(item)}>{item}</Chip>) : null}
          </div>
        </div>

        {shown === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-sage">{total === 0 ? 'Nothing on record yet.' : 'Nothing matches that search.'}</p>
        ) : (
          <ul className="divide-y divide-line">
            {section === 'news' ? articles.map((item) => (
              <Row key={item.id} open={openId === item.id} title={item.title} meta={`${item.category || 'News'} · ${formatDate(item.date)}`} onToggle={() => setOpenId(openId === item.id ? null : item.id)}>
                {item.excerpt ? <p className="max-w-2xl text-sm leading-6 text-ink">{item.excerpt}</p> : null}
                <Actions
                  confirming={confirming === item.id}
                  pending={pending}
                  viewHref={`/news/${item.slug}`}
                  onEdit={() => { setCreating(false); setEditing(item.id); setArticle({ title: item.title, category: item.category, date: item.date, excerpt: item.excerpt, body: item.body }); setError(''); setNotice('') }}
                  onRemove={() => setConfirming(item.id)}
                  onKeep={() => setConfirming(null)}
                  onConfirm={() => void remove(item.id)}
                />
              </Row>
            )) : null}
            {section === 'events' ? calendar.map((item) => (
              <Row key={item.id} open={openId === item.id} title={item.name} meta={`${formatDate(item.date)}${item.time ? ` · ${item.time}` : ''}${item.location ? ` · ${item.location}` : ''}`} mark={item.date >= today() ? 'Upcoming' : 'Past'} onToggle={() => setOpenId(openId === item.id ? null : item.id)}>
                {item.description ? <p className="max-w-2xl text-sm leading-6 text-ink">{item.description}</p> : null}
                <Actions
                  confirming={confirming === item.id}
                  pending={pending}
                  viewHref="/events"
                  onEdit={() => { setCreating(false); setEditing(item.id); setEventForm({ name: item.name, date: item.date, time: item.time, location: item.location, description: item.description }); setError(''); setNotice('') }}
                  onRemove={() => setConfirming(item.id)}
                  onKeep={() => setConfirming(null)}
                  onConfirm={() => void remove(item.id)}
                />
              </Row>
            )) : null}
            {section === 'questions' ? questions.map((item) => (
              <Row key={item.id} open={openId === item.id} title={item.question} meta={item.topic} onToggle={() => setOpenId(openId === item.id ? null : item.id)}>
                <p className="max-w-2xl text-sm leading-6 text-ink">{item.answer}</p>
                <Actions
                  confirming={confirming === item.id}
                  pending={pending}
                  viewHref="/faq"
                  onEdit={() => { setCreating(false); setEditing(item.id); setFaqForm({ topic: item.topic, question: item.question, answer: item.answer }); setError(''); setNotice('') }}
                  onRemove={() => setConfirming(item.id)}
                  onKeep={() => setConfirming(null)}
                  onConfirm={() => void remove(item.id)}
                />
              </Row>
            )) : null}
          </ul>
        )}
      </section>
    </div>
  )
}

function EditorHead({ label }: { label: string }) {
  return (
    <div className="border-b border-line px-4 py-3 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{label}</p>
    </div>
  )
}

function SaveRow({ pending, editing, label, onCancel }: { pending: boolean; editing: boolean; label: string; onCancel: () => void }) {
  return (
    <div className="mt-5 flex flex-col gap-2">
      <button type="submit" className="inline-flex h-11 items-center justify-center bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-60" disabled={pending}>{pending ? 'Saving…' : editing ? `Update ${label}` : `Save ${label}`}</button>
      <button type="button" className="inline-flex h-11 items-center justify-center text-sm font-semibold text-sage" onClick={onCancel}>Cancel</button>
    </div>
  )
}

function Row({ open, title, meta, mark, onToggle, children }: { open: boolean; title: string; meta: string; mark?: string; onToggle: () => void; children: ReactNode }) {
  return (
    <li>
      <button type="button" className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-cream sm:px-5" aria-expanded={open} onClick={onToggle}>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-5 text-ink sm:text-base">{title}</span>
          <span className="mt-1 block truncate text-xs text-sage">{meta}</span>
        </span>
        {mark ? <span className={`shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] ${mark === 'Upcoming' ? 'text-brand' : 'text-sage'}`}>{mark}</span> : null}
      </button>
      {open ? <div className="border-t border-line bg-cream px-4 py-4 sm:px-5">{children}</div> : null}
    </li>
  )
}

function Actions({ confirming, pending, viewHref, onEdit, onRemove, onKeep, onConfirm }: { confirming: boolean; pending: boolean; viewHref: string; onEdit: () => void; onRemove: () => void; onKeep: () => void; onConfirm: () => void }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <button type="button" className="text-sm font-semibold text-forest" onClick={onEdit}>Edit</button>
      <Link href={viewHref} className="text-sm font-semibold text-forest">View</Link>
      {confirming ? (
        <>
          <button type="button" className="text-sm font-semibold text-[#8d4b38] disabled:opacity-60" disabled={pending} onClick={onConfirm}>Confirm remove</button>
          <button type="button" className="text-sm font-semibold text-sage" onClick={onKeep}>Keep</button>
        </>
      ) : (
        <button type="button" className="text-sm font-semibold text-[#8d4b38]" onClick={onRemove}>Remove</button>
      )}
    </div>
  )
}

function Chip({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" className={`h-9 shrink-0 px-3 text-xs font-semibold ${active ? 'bg-brand text-white' : 'border border-line bg-white text-forest'}`} onClick={onClick}>{children}</button>
  )
}
