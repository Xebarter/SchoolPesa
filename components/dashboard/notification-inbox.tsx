'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, GraduationCap, Megaphone, Newspaper, Wallet } from 'lucide-react'
import { createNotification, deleteNotification, markNotificationsRead, setNotificationRead } from '@/lib/donor-actions'
import { formatDate } from '@/lib/format'
import type { NotificationItem } from '@/lib/types'

const icons = {
  gift: Wallet,
  campaign: Megaphone,
  learner: GraduationCap,
  update: Newspaper,
  reminder: Bell,
  system: Bell,
}

export function NotificationInbox({ items }: { items: NotificationItem[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const unread = items.filter((item) => !item.read)
  const visible = filter === 'unread' ? unread : items

  async function remind(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    try {
      await createNotification({ title, body })
      setTitle('')
      setBody('')
      setOpen(false)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The reminder could not be saved.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Alerts</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-ink sm:text-5xl">Notifications</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-sage">Gifts, campaigns, learners and updates land here as soon as they happen.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unread.length > 0 ? (
            <button type="button" className="inline-flex h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-semibold text-forest hover:border-forest" onClick={() => void markNotificationsRead().then(() => router.refresh())}>Mark all read</button>
          ) : null}
          <button type="button" className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? 'Close' : 'Add a reminder'}</button>
        </div>
      </div>

      <section className="mt-6 grid grid-cols-2 overflow-hidden border border-line bg-white" aria-label="Notification summary">
        <div className="border-r border-line p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sage">Unread</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-.04em] text-ink">{unread.length}</p>
        </div>
        <div className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sage">On record</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-.04em] text-ink">{items.length}</p>
        </div>
      </section>

      {open ? (
        <form onSubmit={remind} className="mt-6 grid gap-3 border border-line bg-white p-4 sm:p-5">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Reminder</h2>
          <label className="text-sm font-medium text-ink">Title
            <input className="mt-2 h-11 w-full border border-line bg-cream px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label className="text-sm font-medium text-ink">Details
            <textarea className="mt-2 min-h-24 w-full border border-line bg-cream px-3 py-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand" value={body} onChange={(event) => setBody(event.target.value)} />
          </label>
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          <button type="submit" className="inline-flex h-11 w-fit items-center rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-50" disabled={pending}>{pending ? 'Saving…' : 'Save reminder'}</button>
        </form>
      ) : null}

      <div className="mt-8 flex gap-2">
        {(['all', 'unread'] as const).map((item) => (
          <button key={item} type="button" className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${filter === item ? 'bg-brand text-white' : 'bg-white text-forest border border-line'}`} onClick={() => setFilter(item)}>{item}</button>
        ))}
      </div>

      <section className="mt-3 border border-line bg-white">
        {visible.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-lg font-semibold tracking-tight text-ink">{items.length === 0 ? 'No alerts yet.' : 'Nothing unread.'}</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-sage">{items.length === 0 ? 'A gift, a new learner, or a published update will show up here and in the header.' : 'You are caught up.'}</p>
          </div>
        ) : (
          <ul>
            {visible.map((item) => {
              const Icon = icons[item.kind as keyof typeof icons] ?? Bell
              return (
                <li key={item.id} className="border-b border-line last:border-b-0">
                  <div className="flex gap-3 px-4 py-4 sm:px-5">
                    <span className={`mt-0.5 grid size-9 shrink-0 place-items-center ${item.read ? 'bg-cream text-sage' : 'bg-brand text-white'}`}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{item.title}</p>
                      {item.body ? <p className="mt-1 text-sm leading-6 text-sage">{item.body}</p> : null}
                      <p className="mt-2 text-xs text-sage">{formatDate(item.createdAt || item.date)}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                        {item.href ? <Link href={item.href} className="text-xs font-semibold text-forest" onClick={() => { if (!item.read) void setNotificationRead(item.id, true) }}>Open</Link> : null}
                        <button type="button" className="text-xs font-semibold text-forest" onClick={() => void setNotificationRead(item.id, !item.read).then(() => router.refresh())}>{item.read ? 'Mark unread' : 'Mark read'}</button>
                        <button type="button" className="text-xs font-semibold text-ink" onClick={() => void deleteNotification(item.id).then(() => router.refresh())}>Remove</button>
                      </div>
                    </div>
                    {item.read ? null : <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" aria-hidden />}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
