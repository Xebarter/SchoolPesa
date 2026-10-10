'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { createNotification, deleteNotification, setNotificationRead } from '@/lib/donor-actions'
import { formatDate } from '@/lib/format'
import type { NotificationItem } from '@/lib/types'

export function ReminderForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setError('')
    setSaved(false)
    setPending(true)
    try {
      await createNotification({ title, body: '' })
      setTitle('')
      setSaved(true)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The reminder could not be saved.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input aria-label="Reminder" value={title} onChange={(event) => { setTitle(event.target.value); setSaved(false) }} placeholder="Note something to come back to" required className="h-11 bg-cream" />
        <Button className="h-11 rounded-full bg-forest px-4 text-white hover:bg-brand-deep" disabled={pending}>{pending ? 'Saving' : 'Save'}</Button>
      </div>
      {saved ? <p className="text-xs font-medium text-forest" role="status">Saved to your reminders.</p> : null}
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </form>
  )
}

export function NotificationActions({ id, read }: { id: string; read: boolean }) {
  const router = useRouter()
  return (
    <div className="mt-2 flex gap-3">
      <button type="button" className="text-xs font-semibold text-forest" onClick={() => void setNotificationRead(id, !read).then(() => router.refresh())}>{read ? 'Mark unread' : 'Mark read'}</button>
      <button type="button" className="text-xs font-semibold text-ink" onClick={() => void deleteNotification(id).then(() => router.refresh())}>Remove</button>
    </div>
  )
}

export function NotificationBoard({ items }: { items: NotificationItem[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  async function run(work: () => Promise<void>) {
    setError('')
    try {
      await work()
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The notification could not be saved.')
    }
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    await run(async () => {
      await createNotification({ title, body })
      setTitle('')
      setBody('')
    })
  }

  return (
    <div>
      <form onSubmit={onCreate} className="bg-mist p-5">
        <h2 className="text-sm font-semibold text-ink">Add a reminder</h2>
        <div className="mt-4 grid gap-3">
          <Label>Title<Input className="mt-2" value={title} onChange={(event) => setTitle(event.target.value)} required /></Label>
          <Label>Details<Textarea className="mt-2" value={body} onChange={(event) => setBody(event.target.value)} /></Label>
        </div>
        {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}
        <Button className="mt-4 rounded-full bg-forest text-white hover:bg-brand-deep">Save reminder</Button>
      </form>
      <ul className="mt-6 overflow-hidden bg-mist">
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 border-b border-line px-5 py-4 last:border-0">
            <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${item.read ? 'bg-cream text-sage' : 'bg-forest text-white'}`}>
              <Bell className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-sage">{item.body}</p>
              <p className="mt-2 text-xs text-sage">{formatDate(item.date)}</p>
              <div className="mt-3 flex gap-3">
                <button type="button" className="text-xs font-semibold text-forest" onClick={() => void run(() => setNotificationRead(item.id, !item.read))}>{item.read ? 'Mark unread' : 'Mark read'}</button>
                <button type="button" className="text-xs font-semibold text-ink" onClick={() => void run(() => deleteNotification(item.id))}>Remove</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
