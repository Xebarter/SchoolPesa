'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, GraduationCap, Megaphone, Newspaper, Wallet } from 'lucide-react'
import { markNotificationsRead, setNotificationRead } from '@/lib/donor-actions'
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

export function NotificationBell({ items, onUpdated }: { items: NotificationItem[]; onUpdated?: () => void }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const unread = items.filter((item) => !item.read)
  const recent = items.slice(0, 6)

  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      if (!panel.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function openItem(item: NotificationItem) {
    setOpen(false)
    if (!item.read) await setNotificationRead(item.id, true)
    onUpdated?.()
    router.push(item.href || '/dashboard/notifications')
    router.refresh()
  }

  return (
    <div className="relative" ref={panel}>
      <button
        type="button"
        className="relative grid size-10 place-items-center rounded-full border border-line bg-white text-forest hover:border-forest"
        aria-label={unread.length ? `${unread.length} unread notifications` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-4" />
        {unread.length > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-4 text-white">{unread.length > 9 ? '9+' : unread.length}</span>
        ) : null}
      </button>
      {open ? (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] border border-line bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unread.length > 0 ? (
              <button type="button" className="text-xs font-semibold text-forest" onClick={() => void markNotificationsRead().then(() => { onUpdated?.(); router.refresh() })}>Mark all read</button>
            ) : null}
          </div>
          {recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm leading-6 text-sage">You are caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {recent.map((item) => {
                const Icon = icons[item.kind as keyof typeof icons] ?? Bell
                return (
                  <li key={item.id} className="border-b border-line last:border-b-0">
                    <button type="button" className="flex w-full gap-3 px-4 py-3 text-left hover:bg-cream" onClick={() => void openItem(item)}>
                      <span className={`mt-0.5 grid size-8 shrink-0 place-items-center ${item.read ? 'bg-cream text-sage' : 'bg-brand text-white'}`}>
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{item.title}</span>
                        <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-sage">{item.body}</span>
                        <span className="mt-1 block text-[11px] text-sage">{formatDate(item.createdAt || item.date)}</span>
                      </span>
                      {item.read ? null : <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" aria-hidden />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <Link href="/dashboard/notifications" className="block border-t border-line px-4 py-3 text-center text-xs font-semibold text-forest hover:bg-cream" onClick={() => setOpen(false)}>
            View all
          </Link>
        </div>
      ) : null}
    </div>
  )
}
