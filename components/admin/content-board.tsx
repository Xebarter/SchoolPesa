'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PageIntro, Panel } from '@/components/admin/ui'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { deleteEvent, deleteFaq, deleteNews, saveEvent, saveFaq, saveNews } from '@/lib/admin-actions'
import { formatDate } from '@/lib/format'
import type { EventItem, Faq, NewsArticle } from '@/lib/types'

const pages = [
  ['Home', '/'],
  ['About', '/about'],
  ['Get involved', '/get-involved'],
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
]

export function ContentBoard({ news, events, faqs }: { news: NewsArticle[]; events: EventItem[]; faqs: Faq[] }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [newsId, setNewsId] = useState<string | undefined>()
  const [eventId, setEventId] = useState<string | undefined>()
  const [faqId, setFaqId] = useState<string | undefined>()
  const article = news.find((item) => item.id === newsId)
  const eventItem = events.find((item) => item.id === eventId)
  const faq = faqs.find((item) => item.id === faqId)

  async function run(work: Promise<void>, form?: HTMLFormElement) {
    setError('')
    try {
      await work
      form?.reset()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The record could not be saved.')
    }
  }

  function onNews(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    void run(saveNews({
      id: newsId,
      title: String(data.get('title') || ''),
      excerpt: String(data.get('excerpt') || ''),
      body: String(data.get('body') || ''),
      category: String(data.get('category') || ''),
      date: String(data.get('date') || new Date().toISOString().slice(0, 10)),
    }).then(() => setNewsId(undefined)), event.currentTarget)
  }

  function onEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    void run(saveEvent({
      id: eventId,
      name: String(data.get('name') || ''),
      date: String(data.get('date') || ''),
      time: String(data.get('time') || ''),
      location: String(data.get('location') || ''),
      description: String(data.get('description') || ''),
    }).then(() => setEventId(undefined)), event.currentTarget)
  }

  function onFaq(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    void run(saveFaq({
      id: faqId,
      question: String(data.get('question') || ''),
      answer: String(data.get('answer') || ''),
      topic: String(data.get('topic') || ''),
    }).then(() => setFaqId(undefined)), event.currentTarget)
  }

  return (
    <div>
      <PageIntro title="Content" description="News, events and questions are stored records. The public routes stay fixed." />
      {error ? <p className="mt-4 text-sm text-destructive" role="alert">{error}</p> : null}
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="Pages" description="Fixed routes in the public site.">
          <ul className="divide-y divide-line">
            {pages.map(([title, href]) => (
              <li key={href} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <span className="text-sm font-semibold text-ink">{title}</span>
                <span className="font-mono text-xs text-sage">{href}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={newsId ? 'Edit article' : 'Add an article'} padded>
          <form key={newsId ?? 'new-news'} className="grid gap-3" onSubmit={onNews}>
            <Label>Title<Input className="mt-2" name="title" required defaultValue={article?.title} /></Label>
            <Label>Category<Input className="mt-2" name="category" defaultValue={article?.category} /></Label>
            <Label>Date<Input className="mt-2" name="date" type="date" defaultValue={article?.date} /></Label>
            <Label>Excerpt<Textarea className="mt-2" name="excerpt" defaultValue={article?.excerpt} /></Label>
            <Label>Body<Textarea className="mt-2" name="body" defaultValue={article?.body} /></Label>
            <div className="flex gap-2">
              <Button className="rounded-full bg-forest">{newsId ? 'Update article' : 'Save article'}</Button>
              {newsId ? <Button type="button" variant="outline" className="rounded-full" onClick={() => setNewsId(undefined)}>Cancel</Button> : null}
            </div>
          </form>
        </Panel>
        <Panel title="News" description={`${news.length} articles`}>
          <ul className="divide-y divide-line">
            {news.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-xs text-sage">{item.category} · {formatDate(item.date)}</p>
                </div>
                <span className="flex gap-2 text-xs font-semibold">
                  <button type="button" className="text-forest" onClick={() => setNewsId(item.id)}>Edit</button>
                  <button type="button" className="text-ink" onClick={() => void deleteNews(item.id).then(() => router.refresh())}>Remove</button>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={eventId ? 'Edit event' : 'Add an event'} padded>
          <form key={eventId ?? 'new-event'} className="grid gap-3" onSubmit={onEvent}>
            <Label>Name<Input className="mt-2" name="name" required defaultValue={eventItem?.name} /></Label>
            <Label>Date<Input className="mt-2" name="date" type="date" required defaultValue={eventItem?.date} /></Label>
            <Label>Time<Input className="mt-2" name="time" defaultValue={eventItem?.time} /></Label>
            <Label>Location<Input className="mt-2" name="location" defaultValue={eventItem?.location} /></Label>
            <Label>Description<Textarea className="mt-2" name="description" defaultValue={eventItem?.description} /></Label>
            <div className="flex gap-2">
              <Button className="rounded-full bg-forest">{eventId ? 'Update event' : 'Save event'}</Button>
              {eventId ? <Button type="button" variant="outline" className="rounded-full" onClick={() => setEventId(undefined)}>Cancel</Button> : null}
            </div>
          </form>
        </Panel>
        <Panel title="Events" description={`${events.length} on the calendar`}>
          <ul className="divide-y divide-line">
            {events.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.name}</p>
                  <p className="mt-1 text-xs text-sage">{formatDate(item.date)} · {item.location}</p>
                </div>
                <span className="flex gap-2 text-xs font-semibold">
                  <button type="button" className="text-forest" onClick={() => setEventId(item.id)}>Edit</button>
                  <button type="button" className="text-ink" onClick={() => void deleteEvent(item.id).then(() => router.refresh())}>Remove</button>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={faqId ? 'Edit question' : 'Add a question'} padded>
          <form key={faqId ?? 'new-faq'} className="grid gap-3" onSubmit={onFaq}>
            <Label>Topic<Input className="mt-2" name="topic" required defaultValue={faq?.topic} /></Label>
            <Label>Question<Input className="mt-2" name="question" required defaultValue={faq?.question} /></Label>
            <Label>Answer<Textarea className="mt-2" name="answer" required defaultValue={faq?.answer} /></Label>
            <div className="flex gap-2">
              <Button className="rounded-full bg-forest">{faqId ? 'Update question' : 'Save question'}</Button>
              {faqId ? <Button type="button" variant="outline" className="rounded-full" onClick={() => setFaqId(undefined)}>Cancel</Button> : null}
            </div>
          </form>
        </Panel>
        <Panel title="FAQs" description={`${faqs.length} answers`}>
          <ul className="divide-y divide-line">
            {faqs.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.question}</p>
                  <p className="mt-1 text-xs text-sage">{item.topic}</p>
                </div>
                <span className="flex gap-2 text-xs font-semibold">
                  <button type="button" className="text-forest" onClick={() => setFaqId(item.id)}>Edit</button>
                  <button type="button" className="text-ink" onClick={() => void deleteFaq(item.id).then(() => router.refresh())}>Remove</button>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
