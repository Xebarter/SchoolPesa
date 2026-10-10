'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Bell, GraduationCap, LayoutDashboard, Megaphone, Menu, Newspaper, Receipt, Settings, UserRound, Wallet, X } from 'lucide-react'
import { accountInitials } from '@/lib/supabase/account'
import type { NotificationItem } from '@/lib/types'
import { cn } from '@/lib/utils'

type Icon = ComponentType<{ className?: string }>

const groups: { label: string; links: { label: string; href: string; icon: Icon }[] }[] = [
  {
    label: 'Giving',
    links: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { label: 'My Donations', href: '/dashboard/donations', icon: Wallet },
      { label: 'Receipts', href: '/dashboard/receipts', icon: Receipt },
    ],
  },
  {
    label: 'Impact',
    links: [
      { label: 'My Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
      { label: 'Sponsored Children', href: '/dashboard/sponsored', icon: GraduationCap },
      { label: 'Impact Updates', href: '/dashboard/updates', icon: Newspaper },
    ],
  },
  {
    label: 'Account',
    links: [
      { label: 'Profile', href: '/dashboard/profile', icon: UserRound },
      { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
]

const titles = Object.fromEntries(groups.flatMap((group) => group.links.map((link) => [link.href, link.label])))

function Nav({ onNavigate, unread }: { onNavigate?: () => void; unread: number }) {
  const pathname = usePathname()
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">{group.label}</p>
          <nav className="mt-2 flex flex-col gap-0.5" aria-label={group.label}>
            {group.links.map((link) => {
              const active = pathname === link.href
              const Icon = link.icon
              const showBadge = link.href === '/dashboard/notifications' && unread > 0
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    if (active) onNavigate?.()
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                    active ? 'bg-white text-ink' : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1">{link.label}</span>
                  {showBadge ? (
                    <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold', active ? 'bg-forest text-white' : 'bg-white/15 text-white')}>
                      {unread}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>
        </div>
      ))}
    </div>
  )
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <Image src="/web-app-manifest-192x192.png" alt="" width={36} height={36} className="size-9 rounded-xl bg-cream" />
      <span>
        <span className="block text-sm font-semibold tracking-tight text-white">School Pesa</span>
        <span className="block text-xs text-white/50">Your giving</span>
      </span>
    </Link>
  )
}

function AccountCard({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white">{accountInitials(name)}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-white">{name}</span>
        <span className="block text-xs text-white/50">Donor</span>
      </span>
    </div>
  )
}

export function DashboardShell({ children, notifications, accountName }: { children: ReactNode; notifications: NotificationItem[]; accountName: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const title = titles[pathname] ?? 'Dashboard'

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const unread = notifications.filter((item) => !item.read).length
  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[17.5rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-forest-deep lg:flex">
        <div className="px-5 py-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <Nav unread={unread} />
        </div>
        <div className="p-4">
          <AccountCard name={accountName} />
          <Link href="/" className="mt-3 block px-3 text-xs font-semibold text-white/70 hover:text-white">View public site</Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-cream/95 px-4 backdrop-blur-sm lg:px-8">
          <button
            type="button"
            className="grid size-10 place-items-center bg-mist text-forest lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="donor-menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Donor</p>
            <p className="truncate text-sm font-semibold text-ink">{title}</p>
          </div>
          <Link href="/" className="hidden bg-mist px-3 py-1.5 text-xs font-semibold text-forest hover:bg-forest hover:text-white sm:inline-flex">View site</Link>
          <Link href="/donate" className="rounded-full bg-forest px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-deep">Donate</Link>
        </header>
        <div className="px-4 pb-8 pt-4 lg:px-8 lg:pb-10">{children}</div>
      </div>

      {open && createPortal(
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div id="donor-menu" role="dialog" aria-modal="true" aria-label="Donor menu" className="absolute inset-y-0 left-0 flex w-[min(100%,19rem)] flex-col bg-forest-deep text-white">
            <div className="flex items-center justify-between px-5 py-5">
              <Brand />
              <button type="button" className="grid size-9 place-items-center rounded-full text-white hover:bg-white/10" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <Nav unread={unread} onNavigate={() => setOpen(false)} />
            </div>
            <div className="p-4">
              <AccountCard name={accountName} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
